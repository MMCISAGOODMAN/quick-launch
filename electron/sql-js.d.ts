declare module 'sql.js/dist/sql-asm.js' {
  import type { Database, SqlJsStatic } from 'sql.js'
  export type { Database }
  export default function initSqlJs(): Promise<SqlJsStatic>
}
