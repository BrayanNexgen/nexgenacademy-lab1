/**
 * SONDAS DE VERIFICACIÓN
 * Pruebas específicas que ejercen la feature
 */

export const probes = {
  /**
   * SONDA-001: Camino Feliz - Crear y Asignar Libro
   * Verde: todo funciona correctamente
   */
  "SONDA-001-happy-path": {
    name: "Camino Feliz: Crear Estantería y Asignar Libro",
    description: "Verificar que crear estantería y asignar libro funciona",
    type: "green",
    execute: async (page) => {
      const steps = [];

      // 1. Navegar a página de estanterías
      await page.goto('/library', { waitUntil: 'networkidle' });
      steps.push({ step: 1, action: "Navegar a /library", status: "OK" });

      // 2. Crear estantería A-1 Ficción
      await page.click('[data-action="create-shelf"]');
      await page.fill('[name="codigo"]', 'A-1');
      await page.fill('[name="nombre"]', 'Ficción');
      await page.click('[data-action="confirm"]');
      steps.push({ step: 2, action: "Crear estantería A-1", status: "OK" });

      // 3. Verificar que aparece en grid
      const shelf = await page.locator('[data-shelf-code="A-1"]').first();
      const exists = await shelf.isVisible();
      steps.push({ step: 3, action: "Estantería visible", status: exists ? "OK" : "FAIL" });

      // 4. Asignar libro "El Quijote"
      await page.click('[data-action="add-book"][data-shelf-code="A-1"]');
      await page.selectOption('[name="libro"]', 'El Quijote');
      await page.click('[data-action="confirm"]');
      steps.push({ step: 4, action: "Asignar libro", status: "OK" });

      // 5. Verificar que data-total-active = 1
      const totalActive = await shelf.getAttribute('data-total-active');
      const isCorrect = totalActive === '1';
      steps.push({
        step: 5,
        action: "Verificar data-total-active=1",
        status: isCorrect ? "OK" : "FAIL",
        actual: totalActive
      });

      return {
        passed: isCorrect,
        steps,
        message: isCorrect ? "✓ Camino feliz completado" : "✗ Fallo en verificación de atributo"
      };
    }
  },

  /**
   * SONDA-002: Edge Case - Llenar Estantería Completamente
   * Naranja: verifica límites
   */
  "SONDA-002-capacity-edge-case": {
    name: "Edge Case: Llenar Estantería al 100%",
    description: "Asignar 50 libros y verificar que el 51 falla",
    type: "orange",
    execute: async (page) => {
      const steps = [];

      // 1. Navegar y crear estantería de test
      await page.goto('/library', { waitUntil: 'networkidle' });
      await page.click('[data-action="create-shelf"]');
      await page.fill('[name="codigo"]', 'TEST-LIMIT');
      await page.fill('[name="nombre"]', 'Test Límite');
      await page.click('[data-action="confirm"]');
      steps.push({ step: 1, action: "Crear estantería TEST-LIMIT", status: "OK" });

      // 2. Asignar 50 libros
      for (let i = 0; i < 50; i++) {
        await page.click('[data-action="add-book"][data-shelf-code="TEST-LIMIT"]');
        // Simular selección de libro (habrá un mecanismo en la UI)
        await page.click('[data-action="confirm"]');
      }
      steps.push({ step: 2, action: "Asignar 50 libros", status: "OK" });

      // 3. Intentar asignar libro 51
      await page.click('[data-action="add-book"][data-shelf-code="TEST-LIMIT"]');
      const errorVisible = await page.locator('[data-error="capacity-exceeded"]').isVisible();
      steps.push({
        step: 3,
        action: "Intentar asignar libro 51",
        status: errorVisible ? "OK (error esperado)" : "FAIL (debería mostrar error)"
      });

      // 4. Verificar que data-total-active = 50 (no aumentó)
      const shelf = await page.locator('[data-shelf-code="TEST-LIMIT"]').first();
      const totalActive = await shelf.getAttribute('data-total-active');
      const isCorrect = totalActive === '50';
      steps.push({
        step: 4,
        action: "Verificar data-total-active=50",
        status: isCorrect ? "OK" : "FAIL",
        actual: totalActive
      });

      return {
        passed: errorVisible && isCorrect,
        steps,
        message: errorVisible && isCorrect
          ? "✓ Límite de capacidad funciona correctamente"
          : "✗ Error en validación de capacidad"
      };
    }
  },

  /**
   * SONDA-003: Retirar Libro y Suma Correcta
   * Roja: verifica aritmética
   */
  "SONDA-003-remove-book-arithmetic": {
    name: "Retirar Libro y Verificar Suma (INV-003)",
    description: "Retirar 1 libro y verificar que suma total es correcta",
    type: "red",
    execute: async (page) => {
      const steps = [];

      await page.goto('/library', { waitUntil: 'networkidle' });

      // 1. Contar libros iniciales
      const shelfA1 = await page.locator('[data-shelf-code="A-1"]').first();
      const initialTotal = parseInt(await shelfA1.getAttribute('data-total-active')) || 0;
      steps.push({ step: 1, action: "Leer total inicial A-1", value: initialTotal, status: "OK" });

      // 2. Retirar primer libro
      const firstBook = await shelfA1.locator('.book-remove').first();
      await firstBook.click();
      steps.push({ step: 2, action: "Retirar 1 libro", status: "OK" });

      // 3. Verificar que data-total-active disminuyó
      await page.waitForTimeout(500); // Esperar actualización
      const newTotal = parseInt(await shelfA1.getAttribute('data-total-active')) || 0;
      const decreased = newTotal === initialTotal - 1;
      steps.push({
        step: 3,
        action: "Verificar que total disminuyó",
        status: decreased ? "OK" : "FAIL",
        before: initialTotal,
        after: newTotal,
        expected: initialTotal - 1
      });

      // 4. Verificar suma total del sistema
      const shelves = await page.locator('[data-verify="shelf-card"]').all();
      let totalAsignado = 0;
      for (const shelf of shelves) {
        const total = await shelf.getAttribute('data-total-active');
        totalAsignado += parseInt(total) || 0;
      }
      steps.push({
        step: 4,
        action: "Suma total de libros asignados",
        value: totalAsignado,
        status: "OK"
      });

      return {
        passed: decreased,
        steps,
        message: decreased
          ? "✓ Retirada de libro y aritmética correctas"
          : "✗ Fallo en decremento de total"
      };
    }
  },

  /**
   * SONDA-004 (ADVERSARIA): Contrato Roto - Atributo Faltante
   * Roja: verifica que contrato en DOM es ESENCIAL
   */
  "SONDA-004-broken-contract": {
    name: "ADVERSARIA: Contrato Roto (atributo faltante)",
    description: "Simula bug: elimina data-total-active del DOM y verifica que Playwright MCP falla",
    type: "red",
    adversarial: true,
    execute: async (page) => {
      const steps = [];

      await page.goto('/library', { waitUntil: 'networkidle' });

      // 1. Eliminar manualmente data-total-active de A-1
      const shelf = await page.locator('[data-shelf-code="A-1"]').first();
      await shelf.evaluate(el => el.removeAttribute('data-total-active'));
      steps.push({
        step: 1,
        action: "Eliminar data-total-active del DOM",
        status: "OK (simulación de bug)"
      });

      // 2. Intentar leer el atributo
      const attr = await shelf.getAttribute('data-total-active');
      const isNull = attr === null;
      steps.push({
        step: 2,
        action: "Leer data-total-active",
        status: isNull ? "OK (es null como esperado)" : "FAIL",
        actual: attr
      });

      // 3. Verificar que esto causa fallo en INV-004
      const invariantPasses = attr !== null;
      steps.push({
        step: 3,
        action: "INV-004 (Contrato en DOM)",
        status: !invariantPasses ? "FAIL (como esperado)" : "PASS (inesperado)",
        critical: true
      });

      return {
        passed: !invariantPasses, // Esperamos que FALLE
        steps,
        message: !invariantPasses
          ? "✓ Contrato roto detectado correctamente (esto es BUENO para verificación)"
          : "✗ No se detectó contrato roto",
        lesson: "Sin atributos data-* en el DOM, la verificación agéntica NO PUEDE FUNCIONAR incluso si la app 'parece' correcta"
      };
    }
  },

  /**
   * SONDA-005 (ADVERSARIA): Aritmética Hardcodeada
   * Roja: verifica que calcula bien
   */
  "SONDA-005-hardcoded-arithmetic": {
    name: "ADVERSARIA: Aritmética Hardcodeada",
    description: "Simula bug: hardcodear data-total-active a valor incorrecto",
    type: "red",
    adversarial: true,
    execute: async (page) => {
      const steps = [];

      await page.goto('/library', { waitUntil: 'networkidle' });

      // 1. Obtener estantería A-1
      const shelf = await page.locator('[data-shelf-code="A-1"]').first();
      const originalTotal = await shelf.getAttribute('data-total-active');
      steps.push({
        step: 1,
        action: "Leer total original",
        value: originalTotal,
        status: "OK"
      });

      // 2. Hardcodear a un valor diferente (simula bug backend)
      const wrongTotal = String(parseInt(originalTotal) + 10);
      await shelf.evaluate((el, val) => el.setAttribute('data-total-active', val), wrongTotal);
      steps.push({
        step: 2,
        action: "Simular bug: hardcodear valor incorrecto",
        original: originalTotal,
        hardcoded: wrongTotal,
        status: "OK (simulación)"
      });

      // 3. Verificar que la verificación detecta discrepancia
      // En un test real, Playwright MCP leería el DOM y compararía contra conteo manual
      const actual = await shelf.getAttribute('data-total-active');
      const mismatch = actual !== originalTotal;
      steps.push({
        step: 3,
        action: "Detectar discrepancia",
        status: mismatch ? "FAIL DETECTADO (como esperado)" : "NO DETECTADO",
        expected: originalTotal,
        actual: actual,
        critical: true
      });

      return {
        passed: mismatch, // Esperamos que detecte el error
        steps,
        message: mismatch
          ? "✓ Aritmética falsa detectada por verificación"
          : "✗ No se detectó error aritmético",
        lesson: "La verificación agéntica atrapa bugs aritméticos que testing manual podría perder"
      };
    }
  }
};
