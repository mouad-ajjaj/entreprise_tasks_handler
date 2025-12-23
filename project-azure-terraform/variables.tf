variable "project_name" {
  description = "Le nom de base pour toutes les ressources"
  type        = string
  default     = "projectazureemov2"
}

variable "location" {
  description = "La région Azure principale"
  type        = string
  default     = "France Central"
}

variable "environment" {
  description = "L'environnement"
  type        = string
  default     = "dev"
}
