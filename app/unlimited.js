const { remote } = require('electron');
const { environment } = require('./environment');

const fs = require('fs');

const Write = async (key, value) => {
  const options = {
    method: 'PUT',
    body: JSON.stringify(value),
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const response = await fetch(`${environment.firebaseRealtimeDatabaseUrl}/${key}.json`, options);
  return await response.json();
};

const Read = async key => {
  const response = await fetch(`${environment.firebaseRealtimeDatabaseUrl}/${key}.json`);
  return await response.json();
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

exports.titleService = {
  getTitle: async () => {
    return await Read('title');
  },
  setTitle: async title => {
    await Write('title', title);
  }
};
  
exports.taskService = {
  fetchAll: async () => {
    const tasks = await Read('tasks');

    return tasks ? tasks : [];
  },
  saveTasks: async tasks => {
    // clear null tasks
    const clearNull = items => {
      return items.filter(item => {
        if (item && item.childs) {
          item.childs = clearNull(item.childs);
        }

        return item;
      });
    };

    return await Write('tasks', clearNull(tasks));
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
  exportAllTasks: async () => {
    const now = new Date().toISOString()
    .split('-').join('')
    .split('T').join('')
    .split(':').join('')
    .split('.').join('')
    .split('Z').join('');

    const filename = SaveDialog(now);

    if (filename) {
      const tasks = await Read('tasks');
      fs.writeFileSync(filename, JSON.stringify(tasks));
    }

    return filename;
  },
  importAllTasks: async () => {
    const filename = OpenDialog();

    if (filename && filename.length > 0) {
      const tasks = JSON.parse(fs.readFileSync(filename[0], 'utf-8'));
      await Write('tasks', tasks);
    }

    return null;
  }
};