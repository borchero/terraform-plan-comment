import { ResourceChanges } from './resourceChanges'

export class RenderedPlan {
  createdResources: Record<string, string> | undefined
  updatedResources: Record<string, string> | undefined
  recreatedResources: Record<string, string> | undefined
  deletedResources: Record<string, string> | undefined
  ephemeralResources: Record<string, string> | undefined

  resourcesChanges: ResourceChanges

  constructor(
    createdResources: Record<string, string> | undefined,
    updatedResources: Record<string, string> | undefined,
    recreatedResources: Record<string, string> | undefined,
    deletedResources: Record<string, string> | undefined,
    ephemeralResources: Record<string, string> | undefined
  ) {
    this.createdResources = createdResources
    this.updatedResources = updatedResources
    this.recreatedResources = recreatedResources
    this.deletedResources = deletedResources
    this.ephemeralResources = ephemeralResources

    this.resourcesChanges = new ResourceChanges(
      Object.keys(this.createdResources || {}).length,
      Object.keys(this.updatedResources || {}).length,
      Object.keys(this.recreatedResources || {}).length,
      Object.keys(this.deletedResources || {}).length,
      Object.keys(this.ephemeralResources || {}).length
    )
  }
}
