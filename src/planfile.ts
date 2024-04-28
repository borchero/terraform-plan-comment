import * as semver from 'semver'
import { z } from 'zod'

const planfileSchema = z.object({
  format_version: z.string().refine(
    (v) => {
      const sv = semver.coerce(v)
      return sv && semver.satisfies(sv, '1.x')
    },
    (v) => ({
      message: `Version ${v} of Terraform planfile is currently unsupported (must be version 1.x).`
    })
  ),
  resource_changes: z.array(
    z.object({
      address: z.string(),
      change: z.object({
        actions: z.union([
          z.tuple([z.literal('create')]),
          z.tuple([z.literal('delete')]),
          z.tuple([z.literal('update')]),
          z.tuple([z.literal('delete'), z.literal('create')])
        ])
      })
    })
  )
})

export type StructuredPlanfile = z.infer<typeof planfileSchema>

export function parsePlanfileJSON(json: string): StructuredPlanfile {
  return planfileSchema.parse(json)
}
