// Importar las librerías necesarias
require('dotenv').config()
const axios = require('axios')

// Obtener la clave de API desde el archivo .env
const apiKey = process.env.CHATBOT_GROK_KEY

// Definimos la lista de consultas Prolog válidas
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

// Función para consultar la API de Prolog
async function lookupProlog(prologQuery) {
  try {
    const res = await axios.post(
      'http://localhost:4000/api/prolog/query',
      { query: prologQuery },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
    return res.data // Suponiendo que tu API devuelve los datos en 'response'
  } catch (error) {
    console.error('Error al consultar Prolog:', error.message)
    throw error
  }
}

// Función para encontrar una consulta Prolog válida en la cadena query
function extractPrologQuery(query, prologQueries) {
  for (let i = 0; i < prologQueries.length; i++) {
    const queryStart = query.indexOf(prologQueries[i])
    if (queryStart !== -1) {
      let start = queryStart
      let end = query.indexOf('.', start) + 1 // +1 para incluir el punto final

      if (end > start) {
        let potentialQuery = query.slice(start, end).trim()
        if (potentialQuery[potentialQuery.length - 1] === '.') {
          return potentialQuery
        }
      }
    }
  }
  return null // Si no encontramos una consulta válida
}

// URL de la API de Grok (ajusta según la documentación oficial)
const grokUrl = 'https://api.x.ai/v1/chat/completions'
const systemContent = `
Eres un asistente que ayuda a resolver dudas sobre la asistencia de alumnos.

Debes convertir consultas de lenguaje natural del usuario identificando la reglas de Prolog que puede usarse para responder esa pregunta y responder en base a esas reglas.

Aquí tienes ejemplos de cómo se espera convertir consultas de lenguaje natural: 
- El usuario pregunta "El estudiante con el id 54 estuvo presente el dia 20 de diciembre del 2024 en su clase de la tarde con el id de horario 43?" deberías identificar que generar was_present(54, 43).
- El usuario pregunta "Puedes decirme los estudiantes que hay?" debería generar student(_,X). para obtener todos los estudiantes por nombre, en caso de que le pidiera id y nombre podria ser student(X,Y).
- Cualquier pregunta que pueda caer en el caso de poder contestarse con mi código Prolog existente debe ser realizada la consulta con mi codigo prolog, solo encárgate de identificar cuál de las reglas o hechos existentes puede usarse para resolverla.
- Entonces, si preguntara "que id tiene el estudiante con id 1?" deberías identificar que el hecho student(id, name). puede ser usado para responder a esa pregunta y el query final para la consulta prolog seria student(1, X). por que indica que nos interesa el nombre del estudiante con id 1 donde X va ser el nombre.

Todas tus posibles respuestas deben ser segun los hechos y reglas de Prolog que te di en el mensaje anterior, si no puedes identificar una regla de Prolog para responder a la consulta, solo responde "No se pudo entender tu consulta." y no envies ninguna consulta al prolog.
Toma estos hechos de ejemplo de Prolog como base para responder a las consultas que se te presenten.

Todas las preguntas del usuario en lenguaje natural deben convertirse a consultas prolog para que puedan ser respondidas por la API de Prolog que luego esa respuesta de la API Prolog se interpreta denuevo a lenguaje natural y se muestra al usuario

POSIBLES CONSULTAS PROLOG:
        % Hechos de ejemplo basados en los modelos de datos mencionados te muestran que campos van en cada parametro, recuerda que estos son solo hechos de ejemplo y no necesariamente los que se usaran en la consulta, ya que en las consultas se mostraran con los datos que corresponden en el campo de cada parametro.

        % Hechos de estudiantes (Student); primer parametro es el id del estudiante y el segundo parametro es el nombre del estudiante
        student(id, name).

        % Hechos de carreras (Career); primer parametro es el id de la carrera, el segundo parametro es el nombre de la carrera y el tercer parametro es la descripcion de la carrera
        career(id, name, description).

        % Hechos de asistencias (Attendance); primer parametro es el id de la asistencia, el segundo parametro es el id de la inscripcion, el tercer parametro es el id del horario y el cuarto parametro es el estado de la asistencia
        attendance(id, enrollment id, schedule id, status).

        % Hechos de inscripciones (Enrollment); primer parametro es el id de la inscripcion, el segundo parametro es el id del estudiante, el tercer parametro es el id del curso y el cuarto parametro es la fecha de inscripcion (la fecha tiene este formato 2024-01-01 00:00:00+00)
        enrollment(id, student id, course id, enrollment date).

        % Hechos de horarios (Schedule); primer parametro es el id del horario, el segundo parametro es el nombre del horario, el tercer parametro es la descripcion del horario, el cuarto parametro es el id del curso, el quinto parametro es el id del profesor, el sexto parametro es el dia de la semana, el septimo parametro es la hora de inicio y el octavo parametro es la hora de finalizacion
        schedule(id, name, description, course id, professor id, day of the week, hora de inicio, hora de finalizacion).

        % Total days of school es un hecho que indica el total de dias de clases como parametro en este caso es 10
        total_school_days(10).

        % Grace period for tardiness in minutes es un hecho que indica el periodo de gracia para la tardanza en minutos como parametro en este caso es 15
        grace_period(15).

        % Acceptable attendance percentage es un hecho que indica el porcentaje de asistencia aceptable como parametro en este caso es 80
        grace_rate_attendance(80).

        % Rules

        % 1. Check if a student was present in a specific schedule es una regla que indica si un estudiante estuvo presente en un horario especifico; primer parametro es el id del horario y el segundo parametro es el id del estudiante
        was_present(StudentId, ScheduleId).

        % 2. Query the list of students present in a specific schedule es una regla que indica la lista de estudiantes presentes en un horario especifico; primer parametro es el id del horario y el segundo parametro es la lista de estudiantes y el segundo es una variable anonima que sirve para guardar la lista de los alumnos en ella
        students_present_on_schedule(ScheduleId, Students).
            

        % 3. Query the attendance status of a student for all schedules; primer parametro es el id del estudiante y el segundo parametro es la variable donde se guardara de lista de asistencias de los estudiantes
        student_attendance(StudentId, Attendances).
            

        % 4. Check if student was late in a specific schedule; primer parametro es el id del estudiante y el segundo parametro es el id del horario
        was_late(StudentId, ScheduleId).
            
        
        % 5. Check the status of a student in a specific schedule(works); primer parametro es el id del estudiante, el segundo parametro es el id del horario y el tercer parametro es el estado del estudiante en ese horario
        student_status(StudentId, ScheduleId, Status).

        En resumen todas las posibles consultas son estas:
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
        'student_status'

Las consultas que envies a la API Prolog siempre deben ser en lenguaje Prolog, por ejemplo, "El estudiante con el id 2 llego tarde al horario con id 3" y debe detectar la consulta o codigo prolog adecuado, segun el codigo prolog que le di que en este caso podria ser "was_present(studentId, scheduleId)." NUNCA debes enviar mas texto al API prolog, considera que todo lo que se envie al API Prolog debe ser una consulta prolog valida que si se envia un texto o cualquier cosa que nosea consulta prolog valida habra un error.
`

// Función para hacer una solicitud a Grok
async function callGrok(query) {
  try {
    const response = await axios.post(
      grokUrl,
      {
        model: 'grok-beta',
        messages: [
          {
            role: 'system',
            content: systemContent,
          },
          {
            role: 'user',
            content: query,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const grokResponse = response.data.choices[0].message.content
    console.log('Respuesta de Grok:', grokResponse)

    // Identificar y extraer la consulta Prolog de la respuesta de Grok
    const prologQueryFound = extractPrologQuery(grokResponse, prologQueries)

    if (prologQueryFound) {
      console.log('Consulta Prolog identificada:', prologQueryFound)

      // Realizar la consulta a la API de Prolog
      const prologResult = await lookupProlog(prologQueryFound)

      // Interpretar y convertir la respuesta de Prolog a lenguaje natural
      let naturalLanguageResponse = interpretPrologResult(
        prologQueryFound,
        prologResult
      )
      console.log('Respuesta en lenguaje natural:', naturalLanguageResponse)
      return naturalLanguageResponse
    } else {
      console.log(
        'No se pudo identificar una consulta de Prolog válida en la respuesta de Grok.'
      )
      return 'No se pudo entender tu consulta.'
    }
  } catch (error) {
    console.error(
      'Error al hacer la solicitud a Grok o al procesar la respuesta:',
      error.response ? error.response.data : error.message
    )
    throw error
  }
}

// Función para interpretar el resultado de Prolog en lenguaje natural
function interpretPrologResult(query, result) {
  if (query.includes('student(')) {
    return `Los estudiantes son: ${result
      .map((r) => r.replace('X = ', '').trim())
      .join(', ')}.`
  } else if (query.includes('was_present')) {
    return result.length > 0
      ? 'Sí, el estudiante estuvo presente.'
      : 'No, el estudiante no estuvo presente.'
  } else if (query.includes('students_present_on_schedule')) {
    return `Los estudiantes presentes en ese horario son: ${result.join(', ')}.`
  } else if (query.includes('student_attendance')) {
    return `La asistencia del estudiante es: ${result
      .map(([id, status]) => `Horario ${id}: ${status}`)
      .join(', ')}.`
  } else if (query.includes('was_late')) {
    return result.length > 0
      ? 'Sí, el estudiante llegó tarde.'
      : 'No, el estudiante no llegó tarde.'
  } else if (query.includes('student_status')) {
    return `El estado del estudiante en ese horario es: ${result[0]}.`
  } else {
    return 'No se pudo interpretar la respuesta correctamente.'
  }
}

// Ejemplo de uso
const userQuery = 'Hola Grok, ¿puedes decirme que los estudiantes que hay?'
callGrok(userQuery).then(console.log)
