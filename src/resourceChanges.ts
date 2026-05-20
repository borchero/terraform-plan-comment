export class ResourceChanges {
  created: number
  updated: number
  recreated: number
  deleted: number
  ephemeral: number

  constructor(
    created: number,
    updated: number,
    recreated: number,
    deleted: number,
    ephemeral: number
  ) {
    this.created = created
    this.updated = updated
    this.recreated = recreated
    this.deleted = deleted
    this.ephemeral = ephemeral
  }

  summary(): string {
    return (
      `Resource Changes: ${this.created} to create, ` +
      `${this.updated} to update, ` +
      `${this.recreated} to re-create, ` +
      `${this.deleted} to delete, ` +
      `${this.ephemeral} ephemeral.`
    )
  }
  noChanges(): boolean {
    return !this.created && !this.recreated && !this.updated && !this.deleted && !this.ephemeral
  }
}
