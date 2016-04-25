require('./rules.less')

const _ = require('lodash')

function removeBlankLines (rule) {
  rule.conditions.rules = rule.conditions.rules.filter((rule) => rule.template)
  if (rule.conditions.additionalRules) {
    rule.conditions.additionalRules = rule.conditions.additionalRules.filter((rule) => rule.template)
  }
  return rule
}

function getDeviceTemplates (devicesService) {
  return devicesService.getDeviceTemplates()
    .then((templates) => {
      return _.map(templates, (template) => {
        if (template.channelTemplates) {
          template.channelTemplates.push({
            name: 'log:message',
            id: '_log'
          })
        }
        return {
          id: template.id,
          name: template.name,
          channels: template.channelTemplates
        }
      })
    })
}

/* @ngInject */
const rulesComponent = {
  template: `
    <section class="rules container" ng-hide="rules.selectedRule">
      <header>
        <h1 class="title">Rules List</h1>
        <a class="pull-right new-button" ng-click="rules.createNewRule()">
          <button type="button" class="button primary">New Rule</button>
        </a>
      </header>

      <div class="content">
        <div class="no-rules" ng-if="!rules.rules.length">
          <h3>Your rules will appear here</h3>
          <p>At the moment you haven't created any rules. You can make one by
            <a href="" ng-click="rules.createNewRule()">clicking here</a>.</p>
        </div>

        <div ng-if="rules.rules.length">
          <ul class="rule-list">
            <li ng-repeat="rule in rules.rules track by $index">
              <a class="rule-name" ng-click="rules.editRule(rule.id)">{{rule.ruleConfig.name}}</a>
              <div class="pull-right">
                <a ng-click="rules.editRule(rule.id)">
                  <button type="button" class="button primary-outline">View rule</button>
                </a>
                <button class="button delete-outline" ng-click="rules.removeRule(rule.id)">Remove rule</button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section class="container" ng-show="rules.selectedRule">
      <header>
        <h1 class="title">{{rules.title}}</h1>
      </header>

      <div class="content">
        <form>
          <input class="wide-input" type="text" placeholder="Name" ng-model="rules.rule.name"/>

          <div>
            <h2 class="subtitle">Conditions</h2>
            <condition-list conditions="rules.rule.conditions" templates="rules.templates"></condition-list>
          </div>

          <div>
            <h2 class="subtitle">Actions</h2>
            <div class="actions">
              <div class="form-row">
                <label for="case">
                  <input id="case" type="checkbox" ng-model="rules.rule.actions.salesforceCase.enabled"/>
                  <span>Create a salesforce case titled:</span>
                  <input type="text" class="wide-input" ng-model="rules.rule.actions.salesforceCase.value"/>
                </label>
              </div>

              <!-- <div class="form-row">
                <label for="opportunity">
                  <input id="opportunity" type="checkbox" name='opportunity' value='true' ng-model='caseTypes.opportunity.selected'/>
                  Create a salesforce opportunity titled:
                  <input id="emailName" type="text" class="large-input" name="opportunityName" ng-model='caseTypes.opportunity.value'/>
                </label>
              </div>

              <div class="form-row">
                <label for="emailch">
                  <input id="emailch" type="checkbox" name='emailch' value='true' ng-model='caseTypes.email.selected'/>
                  Send email to:
                  <input id="email" type="text" class="large-input" name="email" ng-model='caseTypes.email.value'/>
                </label>
              </div> -->
            </div>
          </div>

          <div>
            <button class="button primary" type="submit" ng-click="rules.save()">Save</button>
            <button class="button" ng-click="rules.clearSelection()">Cancel</button>
          </div>
        </form>
      </div>
    </section>
  `,
  controllerAs: 'rules',
  /* @ngInject */
  controller (rulesService, devicesService) {
    const ruleTemplate = {
      name: '',
      conditions: {
        mode: 'all',
        rules: [{
          operator: '$eq',
          editing: false
        }],
        additionalRules: []
      },
      actions: {
        salesforceCase: {
          value: '',
          enabled: false
        }
      }
    }

    Promise.all([
      getDeviceTemplates(devicesService),
      rulesService.getRules()
    ]).then((results) => {
      this.templates = results[0]
      this.rules = results[1].data

      this.removeRule = (ruleId) => {
        rulesService.removeRule(ruleId)
          .then(() => {
            rulesService.getRules()
              .then((result) => {
                this.rules = result.data
              })
          })
      }

      this.save = () => {
        if (this.selectedRule === 'new') {
          return rulesService.createRule(removeBlankLines(this.rule))
            .then(() => {
              this.selectedRule = false
              rulesService.getRules()
                .then((result) => {
                  this.rules = result.data
                })
            })
        }

        rulesService.updateRule(this.selectedRule, removeBlankLines(this.rule))
          .then(() => {
            this.selectedRule = false
            rulesService.getRules()
              .then((result) => {
                this.rules = result.data
              })
          })
      }

      this.createNewRule = () => {
        this.title = 'New Rule'
        this.rule = _.clone(ruleTemplate)
        this.selectedRule = 'new'
      }

      this.editRule = (ruleId) => {
        this.title = 'Edit rule'
        this.selectedRule = ruleId
        rulesService.getRule(ruleId)
          .then((result) => {
            this.rule = result.data.ruleConfig
          })
      }

      this.clearSelection = () => {
        this.selectedRule = false
      }
    })
  }
}

module.exports = rulesComponent
