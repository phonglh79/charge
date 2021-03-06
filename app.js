'use strict';

const checkModule = require('./scripts/setup');
const cluster = require('cluster');
module.exports = async(app) => {
  app.messenger.once('init-job', data => {

    if (app.config.ignoreMiddlewareChecker !== true) {
      checkModule(app.config.chargeModule);
    }

    (async() => {
      // Mock a context:
      const ctx = app.createAnonymousContext();
      await ctx.service.token.initEndpoint();

      if (app.config.requireMerge) {
        console.log('Start merge data....');
        const users = await ctx.service.keystone.fetchUsers('RegionOne');
        const promises = [];
        let index = 0;
        const t = await app.model.transaction();
        for (index = 0; index < users.users.length; index++) {
          const user = users.users[index];
          await app.model.Account.findOrCreate({
            where: {
              "user_id": user.id
            },
            transaction: t,
            defaults: {
              "user_id": user.id,
              "domain_id": user.domain_id,
            }
          });
        }

        const tokenObj = await ctx.service.token.getToken();
        const endpoint = tokenObj.endpoint['keystone']['RegionOne'];

        const targetRole = await ctx.curl(`${endpoint}/roles?name=${app.config.charge.billing_role}`, {
          method: 'GET',
          dataType: 'json',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': tokenObj.token,
          },
        });

        if (targetRole.data && targetRole.data.roles.length > 0) {
          const roleId = targetRole.data.roles[0].id;

          const roles = await ctx.service.keystone.fetchAssignments('RegionOne');

          const roleAssignmentDict = new Map();

          roles.role_assignments.forEach(r => {
            if (r.role && r.role.id === roleId) {
              const p = r.scope.project;
              roleAssignmentDict.set(p.id, r.user.id);
            }
          });
          const projects = await ctx.service.keystone.fetchProjects('RegionOne');

          for (index = 0; index < projects.projects.length; index++) {
            const project = projects.projects[index];
            await app.model.Project.findOrCreate({
              where: {
                "project_id": project.id
              },
              transaction: t,
              defaults: {
                "user_id": roleAssignmentDict.get(project.id) || null,
                "project_id": project.id,
                "domain_id": project.domain_id,
                "status": "active",
              }
            });
          }
        }
        t.commit();
      }
    })().then(res => {
      // cluster.worker.exitedAfterDisconnect = true;
      // cluster.worker.on('disconnect', () => {
      //   cluster.worker.isDevReload = true;
      //   // cluster.worker.kill('SIGTERM');
      //   process.exit(0);
      // });
      // cluster.worker.disconnect();
    });
  });

  app.beforeStart(function* () {
    app.model.sync();
    app.model.Subscription.sync();
  });

  app.config.coreMiddleware.unshift('debug');

  process.on('SIGINT', (...args) => {
    console.log('Receive SIGINT  signal!', process.pid);

  });
}