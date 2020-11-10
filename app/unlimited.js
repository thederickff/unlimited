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

const SaveEntity = (key, entity) => {
  if (!entity) {
    throw new Error(`Could not add ${key}: ${JSON.stringify(entity)}`)
  }

  let entities = Read(key);

  if (!entities) {
    entities = [];
  }

  if (!entity.id) {
    let lastId = 0;

    if (entities && entities.length > 0) {
      lastId = entities[entities.length - 1].id;
    }

    entity.id = lastId + 1;
    entities.push(entity);
  } else {
    const index = entities.findIndex(e => e.id === entity.id);

    if (index >= 0) {
      entities[index] = entity;
    } else {
      entities.push(entity);
    }
  }


  Write(key, entities);

  return entity;
};

const DeleteEntity = (key, entityId) => {
  if (!entityId) {
    throw new Error(`Could not delete ${key}: ${entityId}`);
  }

  let entities = Read(key);

  if (!entities) {
    entities = [];
  }

  entities = entities.filter(entity => {
    return entity.id !== entityId;
  });

  Write(key, entities);

  return 'success';
}
  
exports.taskService = {
  fetchAll: () => {
    return Read('tasks');
  },
  save: task => {
    return SaveEntity('tasks', task);
  },
  delete: taskId => {
    return DeleteEntity('tasks', taskId);
  }
};
