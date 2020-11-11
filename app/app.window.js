const { taskService } = require('./unlimited');

const pushNewTask = (rootTasks, newTask, path) => {

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

  taskService.saveTasks(rootTasks);
};

const deleteTask = (rootTasks, path) => {
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
  taskService.saveTasks(rootTasks);
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

const presentTitleAlert = () => {
  const alert = document.createElement('ion-alert');
  alert.header = 'Editar Titulo';
  alert.inputs = [
    {
      placeholder: 'Título',
      type: 'text',
      value: localStorage.getItem('title')
    }
  ];
  alert.buttons = [
    {
      text: 'Cancelar'
    },
    {
      text: 'Atualizar',
      handler: inputs => {
        const title = inputs[0];
        
        localStorage.setItem('title', title);
        render();
      }
    }
  ];
  document.body.appendChild(alert);
  
  return alert.present();
};

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
      placeholder: 'Cor: azul, verde, vermelho',
      value: task && task.color ? colorToText(task.color) : undefined
    }
  ];
  
  alert.buttons = [
    {
      text: 'Cancelar'
    },
    {
      text: task ? 'Atualizar' : 'Adicionar',
      handler: inputs => {
        const name = inputs[0];
        const comment = inputs[1];
        let color = inputs[2];
        
        if (name.length <= 0) {
          return;
        }

        color = textToColor(color);
        
        if (task) {
          task.name = name;
          task.comment = comment;
          task.color = color;
          taskService.saveTasks(rootTasks);
        } else {
          pushNewTask(rootTasks, { name, comment, color }, path);
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
        deleteTask(rootTasks, path);
        render();
      }
    },
    {
      text: 'Cancelar'
    }
  ];

  document.body.appendChild(actionSheet);
  return actionSheet.present();
}

const divTasks = document.querySelector('#tasks');
const buttonNewItem = document.querySelector('.new-item');
const h2RootTitle = document.querySelector('.root-title');

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

  inputChecked.children[0].addEventListener('click', () => {
    task.checked = !task.checked;

    updateCheckedFromTasks(task.childs, task.checked);
    checkParentChecked(rootTasks, path);

    taskService.saveTasks(rootTasks);
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

  buttonExpand.children[0].addEventListener('click', () => {
    task.expanded = !task.expanded;
    taskService.saveTasks(rootTasks, task);
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
      presentTaskAlert(rootTasks, null, path);
    });

    element.appendChild(buttonNewSubitem);
  }

  if (task.expanded && task.childs) {
    divChilds.appendChild(genelTasks(task.childs, path, rootTasks));
    element.append(divChilds);
  }

  return element;
};

const render = () => {
  divTasks.innerHTML = ``;
  divTasks.appendChild(genelTasks(taskService.fetchAll()));
  
  if (!localStorage.getItem('title')) {
    localStorage.setItem('title', 'Nova Lista');
  }

  h2RootTitle.innerHTML = localStorage.getItem('title');
};

(async => {
  buttonNewItem.addEventListener('click', () => {
    presentTaskAlert(taskService.fetchAll());
  });


  h2RootTitle.addEventListener('click', () => {
    presentTitleAlert();
  });

  render();
})();