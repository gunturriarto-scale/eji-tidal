import React from 'react';
import { EcommerceView } from './EcommerceView';
export const ShopeeView = ({ filteredData, dateRange }) => (
  <EcommerceView ordersData={filteredData?.orders || []} platform="shopee" dateRange={dateRange} />
);
