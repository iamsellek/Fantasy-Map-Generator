import { Burg } from './burg';
import { Feature, FeatureType } from './feature';
import { BaseState, FullState } from './state';

export const getFeatureType = (feature: Feature | 0): FeatureType | '' =>
  isFeature(feature) ? feature.type : '';

export const isFeature = (feature: Feature | 0): feature is Feature =>
  feature !== 0;

export const isBurg = (burg: Burg | {}): burg is Burg => !!Object.keys(burg);

export const isFullState = (state: BaseState | FullState): state is FullState =>
  Object.keys(state).includes('campaigns');
