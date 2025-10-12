import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('translations').del();
  const now = new Date().toISOString();

  // ===============================
  // Core Exercise Types
  // ===============================
  const exerciseTypes = [
    ['strength', 'Strength', 'Weightlifting and resistance training'],
    ['cardio', 'Cardio', 'Aerobic and endurance exercises'],
    ['mobility', 'Mobility', 'Flexibility and range-of-motion work'],
    ['plyometric', 'Plyometric', 'Explosive power and jump training'],
    ['balance', 'Balance', 'Stability, control and coordination exercises'],
    ['core', 'Core', 'Midsection strength and stability'],
    ['stretching', 'Stretching', 'Static and dynamic flexibility work'],
    ['other', 'Other', 'Miscellaneous or custom exercise type']
  ];

  // ===============================
  // System Modules / Navigation
  // ===============================
  const modules = [
    ['dashboard', 'Dashboard', 'Overview of current plans and sessions'],
    ['planner', 'Planner', 'Create, edit and schedule training sessions'],
    ['logger', 'Logger', 'Record completed workouts and exercises'],
    ['progress', 'Progress', 'Track personal records and performance'],
    ['feed', 'Community Feed', 'Discover, like and comment on shared sessions'],
    ['profile', 'Profile', 'User settings, privacy and account management'],
    ['auth', 'Authentication', 'Login, registration and security'],
    ['system', 'System', 'Health status and maintenance area']
  ];

  // ===============================
  // Common UI Labels & Buttons
  // ===============================
  const ui = [
    ['save', 'Save', ''],
    ['cancel', 'Cancel', ''],
    ['delete', 'Delete', ''],
    ['edit', 'Edit', ''],
    ['update', 'Update', ''],
    ['create', 'Create', ''],
    ['logout', 'Logout', ''],
    ['login', 'Login', ''],
    ['register', 'Register', ''],
    ['settings', 'Settings', ''],
    ['language', 'Language', ''],
    ['search', 'Search', ''],
    ['confirm', 'Confirm', ''],
    ['back', 'Back', '']
  ];

  // ===============================
  // Status & Roles
  // ===============================
  const statuses = [
    ['status.active', 'Active', 'Account is active and usable'],
    ['status.archived', 'Archived', 'Account is deactivated'],
    ['role.user', 'User', 'Standard FitVibe user'],
    ['role.admin', 'Administrator', 'Has full system access']
  ];

  // ===============================
  // Function to build translation entries
  // ===============================
  function makeEntries(prefix: string, list: string[][], locales: string[]) {
    const results: any[] = [];
    for (const [code, name, desc] of list) {
      for (const locale of locales) {
        switch (locale) {
          case 'de':
            results.push(
              { key: `${prefix}.${code}.name`, locale, value: translate(name, locale), updated_at: now },
              desc && { key: `${prefix}.${code}.description`, locale, value: translate(desc, locale), updated_at: now }
            );
            break;
          case 'fr':
            results.push(
              { key: `${prefix}.${code}.name`, locale, value: translate(name, locale), updated_at: now },
              desc && { key: `${prefix}.${code}.description`, locale, value: translate(desc, locale), updated_at: now }
            );
            break;
          case 'es':
            results.push(
              { key: `${prefix}.${code}.name`, locale, value: translate(name, locale), updated_at: now },
              desc && { key: `${prefix}.${code}.description`, locale, value: translate(desc, locale), updated_at: now }
            );
            break;
          default:
            results.push(
              { key: `${prefix}.${code}.name`, locale, value: name, updated_at: now },
              desc && { key: `${prefix}.${code}.description`, locale, value: desc, updated_at: now }
            );
        }
      }
    }
    return results.filter(Boolean);
  }

  // ===============================
  // Simple translation helper
  // (for demo seed — real app will use external i18n source)
  // ===============================
  function translate(text: string, locale: string): string {
    const dict: Record<string, Record<string, string>> = {
      de: {
        Strength: 'Kraft',
        Cardio: 'Ausdauer',
        Mobility: 'Beweglichkeit',
        Plyometric: 'Plyometrisch',
        Balance: 'Gleichgewicht',
        Core: 'Rumpf',
        Stretching: 'Dehnung',
        Other: 'Sonstiges',
        Dashboard: 'Übersicht',
        Planner: 'Planer',
        Logger: 'Trainingstagebuch',
        Progress: 'Fortschritt',
        'Community Feed': 'Community Feed',
        Profile: 'Profil',
        Authentication: 'Authentifizierung',
        System: 'System',
        Save: 'Speichern',
        Cancel: 'Abbrechen',
        Delete: 'Löschen',
        Edit: 'Bearbeiten',
        Update: 'Aktualisieren',
        Create: 'Erstellen',
        Logout: 'Abmelden',
        Login: 'Anmelden',
        Register: 'Registrieren',
        Settings: 'Einstellungen',
        Language: 'Sprache',
        Search: 'Suchen',
        Confirm: 'Bestätigen',
        Back: 'Zurück',
        Active: 'Aktiv',
        Archived: 'Archiviert',
        User: 'Benutzer',
        Administrator: 'Administrator'
      },
      fr: {
        Strength: 'Force',
        Cardio: 'Cardio',
        Mobility: 'Mobilité',
        Plyometric: 'Plyométrique',
        Balance: 'Équilibre',
        Core: 'Tronc',
        Stretching: 'Étirement',
        Other: 'Autre',
        Dashboard: 'Tableau de bord',
        Planner: 'Planificateur',
        Logger: 'Journal',
        Progress: 'Progrès',
        'Community Feed': 'Fil communautaire',
        Profile: 'Profil',
        Authentication: 'Authentification',
        System: 'Système',
        Save: 'Enregistrer',
        Cancel: 'Annuler',
        Delete: 'Supprimer',
        Edit: 'Modifier',
        Update: 'Mettre à jour',
        Create: 'Créer',
        Logout: 'Déconnexion',
        Login: 'Connexion',
        Register: "S'inscrire",
        Settings: 'Paramètres',
        Language: 'Langue',
        Search: 'Rechercher',
        Confirm: 'Confirmer',
        Back: 'Retour',
        Active: 'Actif',
        Archived: 'Archivé',
        User: 'Utilisateur',
        Administrator: 'Administrateur'
      },
      es: {
        Strength: 'Fuerza',
        Cardio: 'Cardio',
        Mobility: 'Movilidad',
        Plyometric: 'Pliométrico',
        Balance: 'Equilibrio',
        Core: 'Centro',
        Stretching: 'Estiramiento',
        Other: 'Otro',
        Dashboard: 'Panel',
        Planner: 'Planificador',
        Logger: 'Registro',
        Progress: 'Progreso',
        'Community Feed': 'Feed comunitario',
        Profile: 'Perfil',
        Authentication: 'Autenticación',
        System: 'Sistema',
        Save: 'Guardar',
        Cancel: 'Cancelar',
        Delete: 'Eliminar',
        Edit: 'Editar',
        Update: 'Actualizar',
        Create: 'Crear',
        Logout: 'Cerrar sesión',
        Login: 'Iniciar sesión',
        Register: 'Registrarse',
        Settings: 'Configuraciones',
        Language: 'Idioma',
        Search: 'Buscar',
        Confirm: 'Confirmar',
        Back: 'Atrás',
        Active: 'Activo',
        Archived: 'Archivado',
        User: 'Usuario',
        Administrator: 'Administrador'
      }
    };
    return dict[locale]?.[text] || text;
  }

  const locales = ['en', 'de', 'fr', 'es'];

  const entries = [
    ...makeEntries('exercise_type', exerciseTypes, locales),
    ...makeEntries('module', modules, locales),
    ...makeEntries('ui', ui, locales),
    ...makeEntries('status', statuses, locales)
  ];

  await knex('translations').insert(entries);
}
