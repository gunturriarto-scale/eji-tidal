import React from 'react';
import { EcommerceView } from './EcommerceView';
export const TikTokShopView = ({ filteredData, dateRange }) => (
  <EcommerceView ordersData={filteredData?.orders || []} platform="tiktokShop" dateRange={dateRange} />
);
