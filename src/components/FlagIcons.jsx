import React from 'react';

// Using high-quality images from flagcdn for better detail at small sizes
const FlagIcon = ({ code, title }) => (
    <img
        src={`https://flagcdn.com/w80/${code}.png`}
        srcSet={`https://flagcdn.com/w160/${code}.png 2x`}
        width="30"
        height="20"
        alt={title}
        style={{
            display: 'block',
            objectFit: 'cover',
            borderRadius: '2px', // Slight rounding for better look
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }}
    />
);

export const FlagUS = () => <FlagIcon code="us" title="United States" />;
export const FlagVN = () => <FlagIcon code="vn" title="Vietnam" />;
export const FlagJP = () => <FlagIcon code="jp" title="Japan" />;
export const FlagCN = () => <FlagIcon code="cn" title="China" />;
export const FlagES = () => <FlagIcon code="es" title="Spain" />;
