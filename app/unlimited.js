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
  }
};
