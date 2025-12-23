output "resource_group_name" {
  value = azurerm_resource_group.rg.name
}

output "function_app_name" {
  value = azurerm_linux_function_app.function.name
}

# Voici ta nouvelle URL pour le frontend :
output "frontend_url" {
  value = azurerm_storage_account.storage.primary_web_endpoint
}

output "storage_account_name" {
  value = azurerm_storage_account.storage.name
}

output "storage_connection_string" {
  value     = azurerm_storage_account.storage.primary_connection_string
  sensitive = true
}
