import React from 'react';
import { EcommerceView } from './EcommerceView';
export const LazadaView = ({ filteredData, dateRange }) => (
  <EcommerceView ordersData={filteredData?.orders || []} platform="lazada" dateRange={dateRange} />
);
