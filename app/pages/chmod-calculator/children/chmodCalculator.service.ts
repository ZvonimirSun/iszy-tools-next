export interface ChmodState {
  owner: PermissionSet
  group: PermissionSet
  others: PermissionSet
}

export interface PermissionSet {
  read: boolean
  write: boolean
  execute: boolean
}

export function createEmptyChmodState(): ChmodState {
  return {
    owner: { read: true, write: true, execute: true },
    group: { read: true, write: false, execute: true },
    others: { read: true, write: false, execute: true },
  }
}

export function chmodStateToOctal(state: ChmodState) {
  return `${permissionSetToDigit(state.owner)}${permissionSetToDigit(state.group)}${permissionSetToDigit(state.others)}`
}

export function chmodStateToSymbolic(state: ChmodState) {
  return `${permissionSetToSymbolic(state.owner)}${permissionSetToSymbolic(state.group)}${permissionSetToSymbolic(state.others)}`
}

export function parseChmodOctal(value: string): ChmodState {
  const normalized = value.trim()
  if (!/^[0-7]{3}$/.test(normalized)) {
    throw new Error('权限值必须是 3 位八进制数字，例如 755')
  }

  return {
    owner: digitToPermissionSet(Number(normalized[0])),
    group: digitToPermissionSet(Number(normalized[1])),
    others: digitToPermissionSet(Number(normalized[2])),
  }
}

function permissionSetToDigit(permission: PermissionSet) {
  return (permission.read ? 4 : 0) + (permission.write ? 2 : 0) + (permission.execute ? 1 : 0)
}

function digitToPermissionSet(value: number): PermissionSet {
  return {
    read: Boolean(value & 4),
    write: Boolean(value & 2),
    execute: Boolean(value & 1),
  }
}

function permissionSetToSymbolic(permission: PermissionSet) {
  return `${permission.read ? 'r' : '-'}${permission.write ? 'w' : '-'}${permission.execute ? 'x' : '-'}`
}
