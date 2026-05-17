export interface SessionData {
  id: string
  access_token: string
  refresh_token: string
}

export interface SessionTombstone {
  redirectTo: string
}
