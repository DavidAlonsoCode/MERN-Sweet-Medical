describe('Flujo de Médico', () => {
  it('Debería loguearse como médico y ver su panel principal', () => {
    cy.visit('/login')
    cy.wait(2000)
    
    // Ingresar credenciales
    cy.get('input[name="usuario"]').type('mrodriguez')
    cy.wait(2000)
    cy.get('input[name="password"]').type('123456')
    cy.wait(2000)
    
    // Hacer clic en iniciar sesión
    cy.contains('button', 'Iniciar Sesión').click()
    cy.wait(2000)
    
    // Verificar redirección al panel del médico
    cy.url().should('include', '/medico')
    cy.wait(2000)
    
    // Verificar el saludo y panel
    cy.contains('Panel del médico').should('be.visible')
    cy.contains('Hola, Dr.').should('be.visible')
    
    // Verificar que existan las pestañas de la interfaz del médico
    cy.contains('button', 'Mi agenda').should('be.visible')
    cy.contains('button', 'Notificaciones').should('be.visible')
  })
})
