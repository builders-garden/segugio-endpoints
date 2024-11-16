export type QuickNodeNotification = {
  id: string
  created_at: string
  updated_at: string
  name: string
  expression: string
  network: string
  destinations: Array<{
    id: string
    name: string
    to: string
    webhook_type: string
    service: string
    payload_type: number
  }>
  enabled: boolean
}