#!/bin/bash
# Frontend i18n JSX Syntax Fix Script
# This script fixes JSX attributes and children to properly use t() function calls
# Run from project root: bash apps/docs/claude_Protocols/fix_i18n_jsx.sh

set -e

echo "🔧 Starting i18n JSX syntax fixes..."
echo ""

cd apps/frontend/src

# Fix JSX attributes - add curly braces around t() calls in attributes
echo "📝 Fixing JSX attributes..."
find pages components -name "*.tsx" -type f -exec sed -i '
  s/eyebrow=t(/eyebrow={t(/g
  s/title=t(/title={t(/g
  s/description=t(/description={t(/g
  s/placeholder=t(/placeholder={t(/g
' {} \;

# Fix closing parentheses for attributes - need to add closing braces
echo "📝 Fixing attribute closures..."
find pages components -name "*.tsx" -type f -exec sed -i '
  s/\(eyebrow={t([^}]*)\)"/\1}"/g
  s/\(title={t([^}]*)\)"/\1}"/g
  s/\(description={t([^}]*)\)"/\1}"/g
  s/\(placeholder={t([^}]*)\)"/\1}"/g
' {} \;

# Fix JSX children - wrap t() calls that are direct children of elements
echo "📝 Fixing JSX children..."
find pages components -name "*.tsx" -type f -exec sed -i '
  s/<span>t(/<span>{t(/g
  s/)<\/span>/)}<\/span>/g
  s/<strong>t(/<strong>{t(/g
  s/)<\/strong>/)}<\/strong>/g
  s/<p>t(/<p>{t(/g
  s/)<\/p>/)}<\/p>/g
  s/<th>t(/<th>{t(/g
  s/)<\/th>/)}<\/th>/g
  s/<td>t(/<td>{t(/g
  s/)<\/td>/)}<\/td>/g
  s/<button>t(/<button>{t(/g
  s/)<\/button>/)}<\/button>/g
  s/<div>t(/<div>{t(/g
  s/)<\/div>/)}<\/div>/g
  s/<li>t(/<li>{t(/g
  s/)<\/li>/)}<\/li>/g
  s/<h1>t(/<h1>{t(/g
  s/)<\/h1>/)}<\/h1>/g
  s/<h2>t(/<h2>{t(/g
  s/)<\/h2>/)}<\/h2>/g
  s/<h3>t(/<h3>{t(/g
  s/)<\/h3>/)}<\/h3>/g
  s/<label>t(/<label>{t(/g
  s/)<\/label>/)}<\/label>/g
' {} \;

# Fix NavLink children specifically
echo "📝 Fixing NavLink children..."
find pages components -name "*.tsx" -type f -exec sed -i '
  s/<NavLink\([^>]*\)>t(/<NavLink\1>{t(/g
  s/)<\/NavLink>/)}<\/NavLink>/g
' {} \;

# Fix Button children specifically
echo "📝 Fixing Button children..."
find pages components -name "*.tsx" -type f -exec sed -i '
  s/<Button\([^>]*\)>t(/<Button\1>{t(/g
  s/)<\/Button>/)}<\/Button>/g
' {} \;

echo ""
echo "✅ JSX syntax fixes applied successfully!"
echo ""
echo "📋 Next steps:"
echo "  1. Run type check:  cd apps/frontend && pnpm run typecheck"
echo "  2. Run build:       cd apps/frontend && pnpm run build"
echo "  3. Run tests:       cd apps/frontend && pnpm test"
echo "  4. Visual check:    cd apps/frontend && pnpm dev"
echo ""
echo "⚠️  If you see any remaining errors, refer to:"
echo "     apps/docs/claude_Protocols/i18n_frontend_fixes.md"
echo ""
