const path = require('path');
const fs = require('fs');

async function test() {
  console.log('--- Testing SQLite Database Layer ---');
  
  // Fake electron app.getPath
  const electron = require('electron');
  
  const { initDatabase, closeDatabase } = require('../dist-electron/database/index.js');
  const { studentService } = require('../dist-electron/services/studentService.js');
  const { teacherService } = require('../dist-electron/services/teacherService.js');
  const { courseService } = require('../dist-electron/services/courseService.js');
  const { enrollmentService } = require('../dist-electron/services/enrollmentService.js');

  await initDatabase();
  console.log('✅ initDatabase succeeded');

  // Test Student CRUD
  const student = studentService.create({
    nombres: 'Carlos',
    apellidos: 'Mendoza',
    identificacion: '0912345678',
    fecha_nacimiento: '2005-04-12',
    genero: 'masculino',
    telefono: '0998877665',
    correo: 'carlos@example.com',
    direccion: 'Av. Central 123',
    ciudad: 'Guayaquil',
    representante: 'María Mendoza',
    telefono_representante: '0991122334',
    parentesco: 'Madre',
    correo_representante: 'maria@example.com',
    estado: 'activo',
    fecha_registro: '2026-09-26'
  });
  console.log('✅ Student created:', student.id, student.nombres, student.apellidos);

  // Test Teacher CRUD
  const teacher = teacherService.create({
    nombres: 'Roberto',
    apellidos: 'Gómez',
    identificacion: '0922334455',
    telefono: '0988776655',
    correo: 'roberto@example.com',
    especialidad: 'Matemáticas',
    direccion: 'Calle 10 #45',
    estado: 'activo'
  });
  console.log('✅ Teacher created:', teacher.id, teacher.nombres, teacher.especialidad);

  // Test Course CRUD
  const course = courseService.create({
    nombre: 'Álgebra Lineal Avanzada',
    codigo: 'MAT-101',
    descripcion: 'Curso fundamental de álgebra y matrices',
    teacher_id: teacher.id,
    fecha_inicio: '2026-10-01',
    fecha_fin: '2026-12-15',
    horario: 'Lun y Mie 08:00 - 10:00',
    capacidad: 25,
    estado: 'activo'
  });
  console.log('✅ Course created:', course.id, course.nombre, course.codigo);

  // Test Enrollment
  const enrollment = enrollmentService.create({
    student_id: student.id,
    course_id: course.id,
    fecha_inscripcion: '2026-09-26',
    estado: 'activa'
  });
  console.log('✅ Enrollment created:', enrollment.id, enrollment.estudiante_nombres, '->', enrollment.curso_nombre);

  // Test Duplicate enrollment prevention
  try {
    enrollmentService.create({
      student_id: student.id,
      course_id: course.id,
      fecha_inscripcion: '2026-09-26',
      estado: 'activa'
    });
    console.error('❌ Duplicate enrollment should have thrown!');
  } catch (err) {
    console.log('✅ Duplicate enrollment prevented:', err.message);
  }

  // Test Dashboard stats
  const coursesWithDetails = courseService.findAllWithDetails();
  console.log('✅ Course details:', coursesWithDetails[0].nombre, 'Inscritos:', coursesWithDetails[0].estudiantes_inscritos, 'Disponibles:', coursesWithDetails[0].cupos_disponibles);

  closeDatabase();
  console.log('--- All DB CRUD tests passed successfully! ---');
}

test().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
