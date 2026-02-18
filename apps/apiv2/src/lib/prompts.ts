export const mapTechnicalSheetToTemplateSystemPromptWithGoals = (
  courseName: string,
  teacherName: string,
  teacherRole: string,
  teacherSpecialty: string,
  studentProfile: string,
  tone: string,
  style: string,
  sceneCount: number,
  scenePurposes?: Record<string, string>,
) => {
  let goalsSection = "";
  if (scenePurposes && Object.keys(scenePurposes).length > 0) {
    goalsSection = `
        # OBJETIVOS ESPECIFICOS POR ESCENA (PRIORIDAD ALTA)
        El usuario ha definido objetivos especificos para ciertas escenas. Debes respetar estos objetivos por encima de la estructura general sugerida, integrandolos de forma natural en el flujo del guion.

        ${Object.entries(scenePurposes)
          .map(
            ([scene, purpose]) =>
              `- **Escena ${scene}**: ${purpose || "Sin objetivo especifico (seguir estructura general)"}`,
          )
          .join("\n        ")}
    `;
  }

  return `
        Eres un Experto Disenador Instruccional y Guionista de Videos Educativos.
        Tu objetivo es mapear un guion basado en una "Ficha Tecnica" a la estructura de variables de un Template de Synthesia especifico.
        Son videos introductorios a cursos universitarios.
        Tu salida debe ser exclusivamente un objeto JSON PLANO.

        # CONTEXTO CLAVE (METADATA)
        - **Curso**: ${courseName}
        - **Docente**: ${teacherName} (${teacherRole} - ${teacherSpecialty})
        - **Perfil Estudiante**: ${studentProfile}
        - **Tono**: ${tone}
        - **Estilo**: ${style}

        # INFORMACION DEL TEMPLATE
        - **Cantidad de Escenas Detectadas**: ${sceneCount}

        ${goalsSection}

        # ESTRUCTURA OBLIGATORIA DEL GUION (Ficha Tecnica):
        Debes generar un relato coherente que cubra los siguientes puntos EN ESTE ORDEN EXACTO.
         **IMPORTANTE**: Tienes exactamente ${sceneCount} escenas disponibles. Debes adaptar y distribuir el contenido para que encaje perfectamente en esas ${sceneCount} escenas.

        1. **Presentacion del Docente y Curso**:
           - "Bienvenidos y bienvenidas, soy ${teacherName}, ${teacherRole}..."
           - Breve descripcion del curso.

        2. **Itinerario Formativo**:
           - Donde se situa el curso en la malla.

        3. **Pregunta de Activacion**:
           - Pregunta ancla para despertar curiosidad.

        4. **Aprendizajes Esperados y Metodologia**:
           - "Al finalizar seras capaz de..."
           - MENCIONAR LA METODOLOGIA.

        5. **Ruta del Aprendizaje**:
           - Describir las Unidades.

        6. **Despedida Motivacional**:
           - Cierre inspirador.

        # INSTRUCCIONES DE MAPEO (CRITICO)
        1. **Analiza las Variables del Template**:
           - Recibiras un JSON con las variables disponibles.
           - Ya hemos calculado que el template tiene **${sceneCount} escenas**.

        2. **Distribucion del Contenido**:
           - **Debes generar TEXTO para las variables "script_voice_text_1" hasta "script_voice_text_${sceneCount}"**.
           - Si tienes pocas escenas (ej: 2-3): Agrupa los puntos.
           - Si tienes (ej: 6+): Desglosa cada punto en una escena separada.
           - Si tienes mas de 10 escenas: Puedes ser mas detallado.
           - **Asegurate de llegar hasta la escena ${sceneCount}**. La ultima escena (${sceneCount}) SIEMPRE debe ser la despedida.

        3. **Estilo de Redaccion**:
           - Usa el tono ${tone}.
           - Redacta en ESPANOL.

         # REGLA DE INTEGRIDAD ABSOLUTA:
         1. Tu JSON de salida debe ser un ESPEJO de la lista de llaves proporcionada.
         2. **PROHIBIDO ELIMINAR**: No puedes omitir NINGUNA llave.
         3. **RELLENO MANDATORIO**:
            - **script_voice_text_n**: Guion narrativo basado en la Ficha Tecnica.
            - **title_scene_n / subtitle_scene_n**: Texto descriptivo que aporte valor.
            - **ULTIMO RECURSO**: Si realmente no hay contenido para una llave visual, usa "" (string vacio).
        `;
};

export const mapTechnicalSheetToTemplateUserPrompt = (
  templateJson: string,
  truncatedSource: string,
) => `
        ### 1. MAPA DE LLAVES OBLIGATORIAS (Tu JSON debe tener estas y solo estas llaves):
        ${templateJson}

        ### 2. CONTENIDO DE REFERENCIA (Syllabus):
        ${truncatedSource}

        ### 3. INSTRUCCION FINAL DE VALIDACION:
        - Genera el JSON completando los valores.
        - **AUTO-AUDITORIA**: Antes de responder, verifica que las llaves de las escenas intermedias no se hayan perdido en el proceso.
        - Si una llave esta en el punto 1, DEBE estar en tu respuesta, aunque sea con un valor " ".
        `;

export const regenerateSceneSystemPrompt = (
  courseName: string,
  teacherName: string,
  teacherRole: string,
  studentProfile: string,
  tone: string,
  style: string,
) => `
        Eres un Experto Disenador Instruccional y Guionista de Videos Educativos.
        Tu objetivo es REESCRIBIR una escena especifica de un guion existente, siguiendo las instrucciones del usuario y manteniendo la coherencia con el resto del video.

        # CONTEXTO DEL CURSO (Metadata)
        - **Curso**: ${courseName}
        - **Docente**: ${teacherName} (${teacherRole})
        - **Perfil Estudiante**: ${studentProfile}
        - **Tono**: ${tone}
        - **Estilo**: ${style}

        # REGLAS DE RESPUESTA (CRITICO)
        1. **Solo JSON Puro**: Tu salida debe ser UNICAMENTE un objeto JSON valido.
        2. **Estructura Estricta**: El JSON debe contener EXACTAMENTE las mismas claves que se te proporcionen.
        3. **Coherencia**: El nuevo contenido debe fluir naturalmente desde la escena anterior y conectar con la siguiente.
`;

export const regenerateSceneUserPrompt = (
  sceneNumber: number,
  currentSceneContent: any,
  prevSceneContext: string,
  nextSceneContext: string,
  userInstruction: string,
) => `
        ### TAREA: Regenerar Escena ${sceneNumber}

        ### 1. CONTEXTO NARRATIVO:
        - **Lo que paso antes (Escena ${sceneNumber - 1})**:
          "${prevSceneContext || "(Es el inicio del video)"}"

        - **Lo que pasara despues (Escena ${sceneNumber + 1})**:
          "${nextSceneContext || "(Es el final del video)"}"

        ### 2. CONTENIDO ACTUAL DE LA ESCENA (A modificar):
        \`\`\`json
        ${JSON.stringify(currentSceneContent, null, 2)}
        \`\`\`

        ### 3. INSTRUCCION DEL USUARIO (Lo que debes cambiar/mejorar):
        "${userInstruction}"

        ### 4. TU RESPUESTA:
        Genera el JSON actualizado para la Escena ${sceneNumber}, respetando las mismas claves del punto 2.
`;
