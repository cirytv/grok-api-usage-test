const prologQueries = [
  'student',
  'career',
  'attendance',
  'enrollment',
  'schedule',
  'total_school_days',
  'grace_period',
  'grace_rate_attendance',
  'was_present',
  'students_present_on_schedule',
  'student_attendance',
  'was_late',
  'student_status',
]

const query =
  'este es mi codigo prolog student_status(1, X).esabdsahbsdashdbadhbad asdasdsd '

// Función para encontrar una consulta Prolog válida en la cadena query
function extractPrologQuery(query, prologQueries) {
  for (let i = 0; i < prologQueries.length; i++) {
    const queryStart = query.indexOf(prologQueries[i])
    if (queryStart !== -1) {
      // Buscar el inicio de la consulta y el fin con el carácter '.'
      let start = queryStart
      let end = query.indexOf('.', start) + 1 // +1 para incluir el punto final - Valida que la consulta termine con el punto posterior al nombre de la consulta y no con el punto de otra parte del texto

      // Asegurarse de que estamos capturando solo una consulta válida - Valida que el inicio sea menor al final
      if (end > start) {
        let potentialQuery = query.slice(start, end).trim()
        // Verificar que la consulta no esté incompleta o mal formada - Valida que la consulta termine con un punto
        if (potentialQuery[potentialQuery.length - 1] === '.') {
          // Valida que la consulta termine con un punto en la última posición de la cadena potentialQuery
          return potentialQuery // Si encontramos una consulta válida, la retornamos
        }
      }
    }
  }
  return null // Si no encontramos una consulta válida
}

const prologQueryFound = extractPrologQuery(query, prologQueries)

if (prologQueryFound) {
  console.log(prologQueryFound)
} else {
  console.log('No se encontró una consulta Prolog válida en la cadena.')
}
