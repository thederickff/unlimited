const { taskService } = require('./unlimited');

// localStorage.clear();
// localStorage.setItem('tasks', JSON.stringify([
//   {
//     name: 'Order',
//     comment: 'Sort them all before adjusting.',
//     childs: [
//       {
//         name: 'Create Order',
//         done: true
//       },
//       {
//         name: 'Validate',
//         comment: 'Not All of them works'
//       },
//       {
//         name: 'Calculate'
//       }
//     ]
//   },
//   {
//     name: 'Separation'
//   },
//   {
//     name: 'Delivery',
//     childs: [
//       {
//         name: 'Pass A',
//         childs: [
//           {
//             name: 'Pass AA',
//             comment: 'Make sure it works...',
//             done: true
//           }
//         ]
//       },
//       {
//         name: 'Pass B'
//       }
//     ]
//   }
// ]));

// const updateTask = (updatedTask, path) => {
//   const tasks = taskService.fetchAll();

//   if (!tasks) {
//     return;
//   }

//   const indexes = path.split('.');

//   if (!indexes || indexes.length <= 0) {
//     return;
//   }

//   let task, currTasks;
//   indexes.forEach(index => {
//     if (task) {
//       currTasks = task.childs;
//     } else {
//       currTasks = tasks;
//     }

//     if (!tasks || !tasks[index]) {
//       throw new Error(`Could not find task on this path: ${path}`);
//     }

//     task = currTasks[index];
//   });
  
//   task.name = updatedTask.name;
//   task.comment = updatedTask.comment;
//   task.checked = updatedTask.checked;
//   task.childs = updatedTask.childs;

//   console.log(tasks);
// };

const divTasks = document.querySelector('#tasks');

const NewElement = (tag, options) => {
  const element = document.createElement(tag);
  
  if (typeof options === 'string') {
    element.innerHTML = options;
  } else {
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

genelTasks = (tasks, level, tasksParent) => {
  const element = document.createElement('ul');
  
  tasks.forEach((task, index) => {
    element.appendChild(genelTask(tasksParent ? tasksParent : tasks, task, level ? `${level}.${index}` : `${index}`));
  });

  return element;
}

genelTask = (tasks, task, path) => {
  const element = document.createElement('li');
  
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
    taskService.saveTasks(tasks);
    render();
  });

  divTitle.appendChild(inputChecked);
  divTitle.appendChild(NewP1Element('label', {
    innerHTML: task.name,
    htmlFor: path,
    className: task.checked ? 'checked' : ''
  }));

  const buttonExpand = NewP1Element('button', {
    innerHTML: task.expanded ? '-' : '+',
    className: 'expandable'
  });

  buttonExpand.children[0].addEventListener('click', () => {
    task.expanded = !task.expanded;
    taskService.saveTasks(tasks);
    render(); 
  });

  divTitle.appendChild(buttonExpand);

  divHeader.appendChild(divTitle);

  if (task.comment) { 
    divSubtitle.appendChild(NewP1Element('p', {
      innerHTML: task.comment,
      className: task.checked ? 'checked' : ''
    }));
    divHeader.appendChild(divSubtitle);
  }

  element.appendChild(divHeader);

  if (task.expanded) {
    element.appendChild(NewP1Element('button', {
      innerHTML: '+ Subitem',
      className: 'new-task'
    }));
  }

  if (task.expanded && task.childs) {
    divChilds.appendChild(genelTasks(task.childs, path, tasks));
    element.append(divChilds);
  }

  return element;
};

const render = () => {
  divTasks.innerHTML = ``;
  divTasks.appendChild(genelTasks(taskService.fetchAll()));
};

(async => {
  render();
})();