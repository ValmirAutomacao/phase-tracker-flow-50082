// Exports centralizados dos hooks Supabase
export * from './useSupabaseQuery'
export * from './useSupabaseMutation'
export * from './usePermissions'

// Export central de permissões
export { PERMISSION_MODULES, ALL_PERMISSIONS, getPermissionById, getModuleById, isValidPermission } from '@/lib/permissions'