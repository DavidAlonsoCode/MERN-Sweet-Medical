describe('Flujo de Inicio de Sesión', () => {
  it('Debería cargar la página de login y mostrar los elementos principales', () => {
    cy.visit('/login')
    
    // Verificar que estemos en la URL correcta
    cy.url().should('include', '/login')
    
    // Verificar el título
    cy.contains('Sweet Medical').should('be.visible')
    cy.contains('Portal de Pacientes y Profesionales').should('be.visible')
    
    // Verificar que existan los inputs de usuario y contraseña
    cy.get('input[name="usuario"]').should('exist')
    cy.get('input[name="password"]').should('exist')
    
    // Verificar que exista el botón de iniciar sesión
    cy.contains('button', 'Iniciar Sesión').should('exist')
  })
})
