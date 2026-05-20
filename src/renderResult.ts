import type { RenderedPlan } from './renderedPlan'
import { ResourceChanges } from './resourceChanges'

export class RenderResult {
  renderedPlans: RenderedPlan[]

  resourcesChanges: ResourceChanges

  constructor(plans: RenderedPlan[]) {
    this.renderedPlans = plans

    this.resourcesChanges = plans.reduce<ResourceChanges>(
      (acc, plan) => {
        acc.created += plan.resourcesChanges.created
        acc.updated += plan.resourcesChanges.updated
        acc.recreated += plan.resourcesChanges.recreated
        acc.deleted += plan.resourcesChanges.deleted
        acc.ephemeral += plan.resourcesChanges.ephemeral
        return acc
      },
      new ResourceChanges(0, 0, 0, 0, 0)
    )
  }
}
