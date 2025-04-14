'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from '@/components/ui/kibo-ui/kanban';
import type { DragEndEvent } from '@/components/ui/kibo-ui/kanban';
import { useState } from 'react';
import { exampleFeatures, exampleStatuses } from '@/lib/content';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric'
});

const Home = () => {
  const [features, setFeatures] = useState(exampleFeatures);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const status = exampleStatuses.find((status) => status.name === over.id);

    if (!status) {
      return;
    }

    setFeatures(
      features.map((feature) => {
        if (feature.id === active.id) {
          return { ...feature, status };
        }

        return feature;
      })
    );
  };

  return (
    <KanbanProvider onDragEnd={handleDragEnd} className="p-4">
      {exampleStatuses.map((status) => (
        <KanbanBoard key={status.name} id={status.name}>
          <KanbanHeader name={status.name} color={status.color} />
          <KanbanCards>
            {features
              .filter((feature) => feature.status.name === status.name)
              .map((feature, index) => (
                <KanbanCard
                  key={feature.id}
                  id={feature.id}
                  name={feature.name}
                  parent={status.name}
                  index={index}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <p className="m-0 flex-1 font-medium text-sm">
                        {feature.name}
                      </p>
                      <p className="m-0 text-muted-foreground text-xs">
                        {feature.initiative.name}
                      </p>
                    </div>
                    {feature.owner && (
                      <Avatar className="h-4 w-4 shrink-0">
                        <AvatarImage src={feature.owner.image} />
                        <AvatarFallback>
                          {feature.owner.name?.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  <p className="m-0 text-muted-foreground text-xs">
                    {shortDateFormatter.format(feature.startAt)} -{' '}
                    {dateFormatter.format(feature.endAt)}
                  </p>
                </KanbanCard>
              ))}
          </KanbanCards>
        </KanbanBoard>
      ))}
    </KanbanProvider>
  );
};

export default Home;