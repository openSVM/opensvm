import * as React from 'react';
import { Card as RinCard, CardHeader, CardContent } from 'rinlab';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  title?: string | any;
  mode?: string | any;
}

const Card: React.FC<CardProps> = ({ children, mode, title, ...rest }) => {
  return (
    <RinCard {...rest}>
      {title && (
        <CardHeader>
          <h2>{title}</h2>
        </CardHeader>
      )}
      <CardContent>
        {children}
      </CardContent>
    </RinCard>
  );
};

export default Card;
