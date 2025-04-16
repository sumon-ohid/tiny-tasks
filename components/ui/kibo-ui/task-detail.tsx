                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Start Date</div>
                        <div className="font-medium">
                          {format(
                            task.startAt instanceof Date 
                              ? task.startAt 
                              : new Date(task.startAt || Date.now()),
                            'MMM d, yyyy'
                          )}
                        </div>
                      </div>
                      
                      <div className="text-muted-foreground">→</div>
                      
                      <div className="space-y-1 text-right">
                        <div className="text-xs text-muted-foreground">Due Date</div>
                        <div className="font-medium">
                          {format(
                            task.endAt instanceof Date 
                              ? task.endAt 
                              : new Date(task.endAt || Date.now()),
                            'MMM d, yyyy'
                          )}
                        </div>
                      </div> 