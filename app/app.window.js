const { taskService, titleService } = require('./unlimited');

const pushNewTask = async (rootTasks, newTask, path) => {

  if (path) {
    const indexes = path.split('.');

    if (!indexes || indexes.length <= 0) {
      return;
    }
  
    let task, currTasks;
  
    indexes.forEach(index => {
      if (task) {
        currTasks = task.childs;
      } else {
        currTasks = rootTasks;
      }
  
      if (!currTasks || !currTasks[index]) {
        throw new Error(`Could not find task on this path: ${path}`);
      }
  
      task = currTasks[index];
    });

    if (!task.childs) {
      task.childs = [];
    }
  
    task.childs.push(newTask);  
  } else {
    rootTasks.push(newTask);
  }

  await taskService.saveTasks(rootTasks);
};

const deleteTask = async (rootTasks, path) => {
  const indexes = path.split('.');

  let task, currTasks;

  indexes.forEach(index => {
    if (task) {
      currTasks = task.childs;
    } else {
      currTasks = rootTasks;
    }

    task = currTasks[index];
  });

  delete currTasks[indexes[indexes.length - 1]];
  
  await taskService.saveTasks(rootTasks);
};

const updateCheckedFromTasks = (tasks, checked) => {
  if (!tasks) {
    return;
  }

  tasks.forEach(task => {
    if (task.childs) {
      updateCheckedFromTasks(task.childs, checked);
    }

    task.checked = checked;
  });
}

const checkParentChecked = (rootTasks, path) => {
  const indexes = path.split('.');
  indexes.pop();

  let task, currTasks;
  indexes.forEach(index => {
    if (task) {
      currTasks = task.childs;
    } else {
      currTasks = rootTasks;
    }

    task = currTasks[index];
  });

  if (task && task.childs) {
    task.checked = task.childs.filter(child => child.checked).length === task.childs.length;
  }
};

const presentMessageAlert = (title, message) => {
  if (title && message) {
    const alert = document.createElement('ion-alert');
    alert.header = title;
    alert.message = message;
    alert.buttons = [
      {
        text: 'Ok'
      }
    ];

    document.body.appendChild(alert);

    alert.present();
  }
};

const presentTitleAlert = async () => {
  const loading = presentLoading();

  try {
    const title = await titleService.getTitle();
  
    const alert = document.createElement('ion-alert');
    alert.header = 'Editar Titulo';
    alert.inputs = [
      {
        placeholder: 'Título',
        type: 'text',
        value: title
      }
    ];
    alert.buttons = [
      {
        text: 'Cancelar'
      },
      {
        text: 'Atualizar',
        handler: async inputs => {
          const newTitle = inputs[0];
          
          const saveLoading = presentLoading();

          try {
            await titleService.setTitle(newTitle);
            saveLoading.dismiss();
          } catch (error) {
            saveLoading.dismiss();
            console.error(error);
          }

          render();
        }
      }
    ];
    document.body.appendChild(alert);
    loading.dismiss();
    return alert.present();
  
  } catch (error) {
    loading.dismiss();
    console.error(error);
  }

  return null;
};

const presentLoading = () => {
  const loading = document.createElement('ion-loading');
  loading.message = 'Carregando...';
  document.body.appendChild(loading);
  loading.present();

  return loading;
}

const textToColor = text => {
  switch (text.toLocaleLowerCase()) {
    case 'vermelho':
      return 'red';
    case 'verde':
      return 'green';
    case 'azul':
      return 'blue';
    case 'rosa':
      return 'pink';
    case 'laranja':
      return 'orange';
    case 'amarelo':
      return 'yellow';
  }

  return text;
};

const colorToText = color => {
  switch (color) {
    case 'red':
      return 'Vermelho';
    case 'green':
      return 'Verde';
    case 'blue':
      return 'Azul';
    case 'pink':
      return 'Rosa';
    case 'orange':
      return 'Laranja';
    case 'yellow':
      return 'Amarelo';
  }

  return color;
}

const presentTaskAlert = (rootTasks, task, path) => {
  const alert = document.createElement('ion-alert');
  alert.header = task ? 'Editar Item' : 'Novo Item';
  alert.inputs = [
    { 
      placeholder: 'Nome',
      type: 'text',
      value: task ? task.name : undefined
    },
    {
      placeholder: 'Descrição (Opcional)',
      type: 'text',
      value: task && task.comment ? task.comment : undefined
    },
    {
      placeholder: 'Cor: azul, verde, vermelho...',
      value: task && task.color ? colorToText(task.color) : undefined
    }
  ];
  
  alert.buttons = [
    {
      text: 'Cancelar'
    },
    {
      text: task ? 'Atualizar' : 'Adicionar',
      handler: async inputs => {
        const name = inputs[0];
        const comment = inputs[1];
        let color = inputs[2];
        
        if (name.length <= 0) {
          return;
        }

        color = textToColor(color);
        
        const loading = presentLoading();

        try {
          if (task) {
            task.name = name;
            task.comment = comment;
            task.color = color;
            await taskService.saveTasks(rootTasks);
          } else {
            await pushNewTask(rootTasks, { name, comment, color }, path);
          }

          loading.dismiss();
        } catch (error) {
          loading.dismiss();
          console.error(error);
        }
 
        render();
      }
    }
  ];
  
  document.body.appendChild(alert);
  return alert.present();
}

const presentAreYouSureToDelete = (rootTasks, path) => {
  const alert = document.createElement('ion-alert');
  alert.header = 'Apagar Item';
  alert.message = 'Tem certeza disso?';
  alert.buttons = [
    {
      text: 'Cancelar'
    },
    {
      text: 'Apagar',
      handler: async () => {
        const loading = presentLoading();

        try {
          await deleteTask(rootTasks, path);
          loading.dismiss();
        } catch (error) {
          loading.dismiss();
          console.error(error);
        }

        render();
      }
    }
  ];
  document.body.appendChild(alert);
  return alert.present();
}

const presentOptionsActionSheet = (rootTasks, task, path) => {
  if (!task) {
    return;
  }

  const actionSheet = document.createElement('ion-action-sheet');
  actionSheet.header = task.name;

  actionSheet.buttons = [
    {
      icon: 'cloud-download',
      text: 'Exportar Item',
      handler: () => {
        if (taskService.exportTask(task)) {
          presentMessageAlert('Exportar Item', 'Item exportado com sucesso.');
        }
      }
    },
    {
      icon: 'pencil',
      text: 'Editar Item',
      handler: () => {
        presentTaskAlert(rootTasks, task, path);
      }
    },
    {
      icon: 'trash',
      text: 'Apagar Item',
      handler: () => {
        presentAreYouSureToDelete(rootTasks, path);
      }
    },
    {
      text: 'Cancelar'
    }
  ];

  document.body.appendChild(actionSheet);
  return actionSheet.present();
}

const presentNewItemActionSheet = (rootTasks, task, path) => {
  const actionSheet = document.createElement('ion-action-sheet');
  actionSheet.header = path ? 'Novo Subitem' : 'Novo Item';

  actionSheet.buttons = [
    {
      icon: 'add',
      text: 'Novo',
      handler: () => {
        presentTaskAlert(rootTasks, null, path);
      }
    },
    {
      icon: 'cloud-upload',
      text: 'Importar',
      handler: async () => {
        const importedItem = taskService.importTask(task);
        if (importedItem) {
          const loading = presentLoading();

          try {
            await pushNewTask(rootTasks, importedItem, path);
            loading.dismiss();
            presentMessageAlert('Importar Item', 'Item importado com sucesso.');
          } catch (error) {
            loading.dismiss();
            console.error(error);
          }

          render();
        }
      }
    },
    {
      text: 'Cancelar'
    }
  ];

  document.body.appendChild(actionSheet);
  return actionSheet.present();
}

const presentExportImportActionSheet = () => {
  const actionSheet = document.createElement('ion-action-sheet');
  actionSheet.header = 'Árvore';
  actionSheet.buttons = [
    {
      icon: 'cloud-upload',
      text: 'Importar',
      handler: async () => {
        const loading = presentLoading();
        try {
          await taskService.importAllTasks();
          loading.dismiss();
          presentMessageAlert('Importar Árvore', 'Items importados com sucesso');
        } catch (error) {
          loading.dismiss();
          console.error(error);
        }

        render();
      }
    },
    {
      icon: 'cloud-download',
      text: 'Exportar',
      handler: async () => {
        const loading = presentLoading();

        try {
          await taskService.exportAllTasks();
          loading.dismiss();
          presentMessageAlert('Exportar Árvore', 'Items exportados com sucesso');
        } catch (error) {
          loading.dismiss();
          console.error(error);
        }
      }
    },
    {
      text: 'Cancelar'
    }
  ]

  document.body.appendChild(actionSheet);
  actionSheet.present();
};

const divTasks = document.querySelector('#tasks');
const buttonNewItem = document.querySelector('.new-item');
const h2RootTitle = document.querySelector('.root-title');
const buttonExportImportTree = document.querySelector('.export-import-tree');

const NewElement = (tag, options) => {
  const element = document.createElement(tag);
  
  if (typeof options === 'string') {
    element.innerHTML = options;
  } else if (typeof options === 'object') {
    Object.keys(options).forEach(key => {
      element[key] = options[key];
    });
  }

  return element;
}

const NewP1Element = (tag, options) => {
  const divP1 = NewElement('div', {
    className: 'p-1'
  });
  divP1.appendChild(NewElement(tag, options));

  return divP1;
};

let genelTasks, genelTask;

genelTasks = (tasks, level, rootTasks) => {
  const element = document.createElement('ul');
  
  tasks.forEach((task, index) => {
    element.appendChild(genelTask(rootTasks ? rootTasks : tasks, task, level ? `${level}.${index}` : `${index}`));
  });

  return element;
}

genelTask = (rootTasks, task, path) => {
  const element = document.createElement('li');
  element.className = task.color ? `color ${task.color}` : ``;
  
  const divHeader = NewElement('div', {
    className: 'task-header'
  });

  const divTitle = NewElement('div', {
    className: 'task-title'
  });

  const divSubtitle = NewElement('div', {
    className: 'task-subtitle'
  });

  const divChilds = NewElement('div', {
    className: 'task-childs'
  });

  const inputChecked = NewP1Element('input', {
    type: 'checkbox',
    checked: task.checked,
    id: path
  });

  inputChecked.children[0].addEventListener('click', async () => {
    task.checked = !task.checked;

    updateCheckedFromTasks(task.childs, task.checked);
    checkParentChecked(rootTasks, path);

    const loading = presentLoading();
    
    try {
      await taskService.saveTasks(rootTasks);
      loading.dismiss();  
    } catch (error) {
      loading.dismiss();
      console.error(error);
    }

    render();
  });

  divTitle.appendChild(inputChecked);
  
  const h2Name = NewP1Element('h2', {
    innerHTML: task.name,
    className: task.checked ? 'checked' : ''
  });
  h2Name.children[0].addEventListener('click', () => {
    presentOptionsActionSheet(rootTasks, task, path);
  });

  divTitle.appendChild(h2Name);

  const buttonExpand = NewP1Element('button', {
    innerHTML: task.expanded ? '-' : '+',
    className: 'expandable'
  });

  buttonExpand.children[0].addEventListener('click', async () => {
    task.expanded = !task.expanded;
    
    const loading = presentLoading();
    try {
      await taskService.saveTasks(rootTasks, task);
      loading.dismiss();  
    } catch (error) {
      loading.dismiss();
      console.error(error);
    }

    render(); 
  });

  divTitle.appendChild(buttonExpand);

  if (task.childs) {
    divTitle.appendChild(NewP1Element('div', {
      innerHTML: `(${task.childs.filter(task => task.checked).length}/${task.childs.length})`
    }));
  }

  divHeader.appendChild(divTitle);

  if (task.comment) {
    const pComment = NewElement('p', {
      innerHTML: task.comment,
      className: task.checked ? 'checked' : ''
    });

    pComment.addEventListener('click', () => {
      presentOptionsActionSheet(rootTasks, task, path);
    });

    divSubtitle.appendChild(pComment);
    divHeader.appendChild(divSubtitle);
  }

  element.appendChild(divHeader);

  if (task.expanded) {
    const buttonNewSubitem = NewP1Element('button', {
      innerHTML: '+ Subitem',
      className: 'new-task'
    });
    buttonNewSubitem.children[0].addEventListener('click', () => {
      presentNewItemActionSheet(rootTasks, null, path);
    });

    element.appendChild(buttonNewSubitem);
  }

  if (task.expanded && task.childs) {
    divChilds.appendChild(genelTasks(task.childs, path, rootTasks));
    element.append(divChilds);
  }

  return element;
};

const render = async tasks => {
  if (!tasks) {
    const loading = presentLoading();
    try {
      tasks = await taskService.fetchAll();
      loading.dismiss();  
    } catch (error) {
      loading.dismiss();
      console.error(error);
    }
  }
  
  divTasks.innerHTML = ``;
  divTasks.appendChild(genelTasks(tasks));
  
  const title = await titleService.getTitle();
   
  if (!title) {
    const newTitle = 'Nova Lista';

    try {
      await titleService.setTitle(newTitle);
    } catch (error) {
      console.error(error);
    }

    h2RootTitle.innerHTML = newTitle;
  } else {
    h2RootTitle.innerHTML = title;
  }
};

setTimeout(async () => {
  const loading = presentLoading();
  const tasks = await taskService.fetchAll();
  loading.dismiss();

  buttonNewItem.addEventListener('click', () => {
    presentNewItemActionSheet(tasks);
  });

  h2RootTitle.addEventListener('click', () => {
    presentTitleAlert();
  });

  buttonExportImportTree.addEventListener('click', () => {
    presentExportImportActionSheet();
  });

  render(tasks);
}, 500);