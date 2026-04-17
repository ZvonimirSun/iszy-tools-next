declare module 'relationship.js' {
  export interface RelationshipOptions {
    text: string
    sex?: 0 | 1
    reverse?: boolean
    type?: 'default' | 'chain'
  }

  export default function relationship(options: RelationshipOptions): unknown
}
