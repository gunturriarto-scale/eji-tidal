import React from 'react';
import { EcommerceView } from './EcommerceView';
export const TokopediaView = ({ filteredData, dateRange }) => (
  <EcommerceView ordersData={filteredData?.orders || []} platform="tokopedia" dateRange={dateRange} />
);
