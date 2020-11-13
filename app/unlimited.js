const { remote } = require('electron');
const fs = require('fs');

if (typeof localStorage === "undefined" || localStorage === null) {
  const LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./storage');
}

const Write = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const Read = key => {
  return JSON.parse(localStorage.getItem(key));
}

const OpenDialog = () => {
  const dialog = remote.dialog;
  const win = remote.getCurrentWindow();

  return dialog.showOpenDialogSync(win, {
    title: "Importar Arquivo",
    buttonLabel : "Importar",
    filters :[
     {name: 'Unlimited', extensions: ['ultd']},
     {name: 'Todos os Arquivos', extensions: ['*']}
    ]
  });
};

const SaveDialog = name => {
  const dialog = remote.dialog;
  const win = remote.getCurrentWindow();

  return dialog.showSaveDialogSync(win, {
    title: "Exportar Arquivo",
    buttonLabel : "Exportar",
    defaultPath: `${name}.ultd`,
    filters :[
      {name: 'Unlimited', extensions: ['ultd']},
      {name: 'Todos os Arquivos', extensions: ['*']}
    ]
  });
}
  
exports.taskService = {
  fetchAll: () => {
    const tasks = Read('tasks');
    return tasks ? tasks : [];
  },
  saveTasks: tasks => {
    // clear null tasks
    const clearNull = items => {
      return items.filter(item => {
        if (item && item.childs) {
          item.childs = clearNull(item.childs);
        }

        return item;
      });
    };

    return Write('tasks', clearNull(tasks));
  },
  exportTask: task => {
    const filename = SaveDialog(task.name);

    if (filename) {
      fs.writeFileSync(filename, JSON.stringify(task));
    }

    return filename;
  },
  importTask: () => {
    const filename = OpenDialog();

    if (filename && filename.length > 0) {
      return JSON.parse(fs.readFileSync(filename[0], 'utf-8'));
    }

    return null;
  },
  exportAllTasks: () => {
    const now = new Date().toISOString()
    .split('-').join('')
    .split('T').join('')
    .split(':').join('')
    .split('.').join('')
    .split('Z').join('');

    const filename = SaveDialog(now);

    if (filename) {
      fs.writeFileSync(filename, JSON.stringify(Read('tasks')));
    }

    return filename;
  },
  importAllTasks: () => {
    const filename = OpenDialog();

    if (filename && filename.length > 0) {
      const tasks = JSON.parse(fs.readFileSync(filename[0], 'utf-8'));
      Write('tasks', tasks);
    }

    return null;
  }
};