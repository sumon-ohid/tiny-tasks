  // Ensure initialFeatures conforms to Feature[] type
  const featuresToSet: Feature[] = storedFeatures 
    ? JSON.parse(storedFeatures).map((f: Partial<Feature>): Feature => ({
        ...f,
        // Ensure required properties have default values
        id: f.id || `feat_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        name: f.name || 'Untitled Task',
        // Ensure dates are Date objects or undefined
        startAt: f.startAt ? new Date(f.startAt) : undefined,
        endAt: f.endAt ? new Date(f.endAt) : undefined,
        // Ensure status is correctly typed (assuming it's stored properly)
        status: f.status || { id: 'todo', name: 'To Do', color: '#6B7280' }, // Add fallback if status can be missing
      })) 