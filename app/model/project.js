'use strict';

const ModelBase = require('../utils/model_base');

const hooks = new ModelBase();

module.exports = app => {
  const {
    STRING,
    INTEGER,
    UUID,
    BOOLEAN,
    DECIMAL,
    ENUM,
    BIGINT,
  } = app.Sequelize;
  return app.model.define('project', {
    id: {
      type: INTEGER,
      length: 11,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: UUID,
    project_id: {
      type: UUID,
      required: true
    },
    consumption: {
      type: DECIMAL(20, 4),
      defaultValue: 0
    },
    domain_id: {
      type: STRING(255)
    },
    status: {
      type: ENUM('active', 'deactive', 'deleted'),
      defaultValue: 'active'
    },
    created_at: BIGINT,
    updated_at: BIGINT,
  }, {
    timestamps: false,
    freezeTableName: true,
    tableName: "project",
    charset: "utf8",
    indexes: [{
      fields: ["user_id", "project_id", "domain_id"]
    }],
    classMethods: {
      /**
       * List the product and output as a Map according by the project id.
       */
      async listProductMap(t) {
        const projects = await this.findAll({
          where: {
            status: 'active',
          },
          transaction: t,
        });

        const projectMap = new Map();

        projects.forEach(project => {
          projectMap.set(project.project_id, project);
        });

        return projectMap;
      },
      findProjectWithAccountById(id, transaction) {
        return this.findOne({
          where: {
            project_id: id,
          },
          transaction: transaction,
          include: [app.model.models.account],
        });
      },
      associate(model) {
        this.belongsTo(app.model.models.account, {
          foreignKey: 'user_id',
          targetKey: 'user_id',
        });
      }
    },
    hooks: hooks.toJSON(),
  });
};