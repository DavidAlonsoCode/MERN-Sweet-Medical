describe('Flujo de Paciente', () => {
  it('Debería loguearse como paciente, buscar turnos y reservar desde el celular', () => {
    cy.visit('http://localhost:3001/login')

    // 1. Ingresar credenciales
    cy.contains('label', 'Usuario').parent().find('input').type('p_garcia')
    cy.wait(2000)
    cy.contains('label', 'Contraseña').parent().find('input[type="password"]').type('123456')
    cy.wait(2000)

    // 2. Antes de ingresar, apretar el botón de ver su contraseña
    cy.get('button[aria-label="Mostrar contraseña"]').click()

    // 3. Esperar 2 segundos
    cy.wait(2000)

    // 4. Iniciar sesión
    cy.contains('button', 'Iniciar Sesión').click()
    cy.wait(2000)

    // Verificamos que entramos correctamente al panel del paciente
    cy.url({ timeout: 10000 }).should('include', '/paciente')
    cy.wait(2000)

    // 5. Achicar la pantalla al ancho de un celular
    cy.viewport(375, 667)
    cy.wait(2000)

    // 6. En la búsqueda de turnos, seleccionar como Profesional a "María Rodriguez"
    cy.contains('button', 'Todos los profesionales').scrollIntoView().click()
    cy.wait(2000) // Damos tiempo a que el portal de HeroUI se abra y sea visible por humanos
    // Hacemos click específicamente en el contenedor de la opción para que HeroUI registre el evento
    cy.get('[role="option"]').contains('María Rodríguez').click({ force: true })
    cy.wait(2000)

    // 7. Apretar "Buscar" (enviamos el formulario directamente para evitar problemas de scroll en mobile)
    cy.get('form').submit()
    cy.wait(2000)
    
    // Esperamos a que termine de buscar (el texto aparece en un elemento <p>)
    cy.get('p').contains('turnos disponibles', { timeout: 10000 }).should('be.visible')

    // 8. Deslizarse hasta el primer turno y apretar "Añadir al carrito"
    cy.get('.hover\\:shadow-lg').eq(0).scrollIntoView().contains('button', 'Añadir al carrito').click()
    cy.wait(2000)

    // 9. Lo mismo para el tercer turno
    cy.get('.hover\\:shadow-lg').eq(2).scrollIntoView().contains('button', 'Añadir al carrito').click()
    cy.wait(2000)

    // 10. Apretar "Ver y confirmar" en la barra generada en la parte inferior/superior
    cy.contains('button', /Ver y Confirmar/i).click()
    cy.wait(2000)

    // 11. Apretar "Confirmar Reservas"
    cy.contains('button', 'Confirmar Reservas').click()
    cy.wait(2000)

    // Verificamos que el modal se cierre y el carrito se haya vaciado (los botones vuelven a decir Añadir)
    cy.contains('Confirmar Reservas').should('not.exist')
    cy.contains('button', 'Añadir al carrito', { timeout: 10000 }).should('be.visible')
  })
})
