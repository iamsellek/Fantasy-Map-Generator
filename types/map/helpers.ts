const getFeatureType = (feature: Feature | 0): FeatureType | '' =>
  isFeature(feature) ? feature.type : '';

const isFeature = (feature: Feature | 0): feature is Feature => feature !== 0;

const isBurg = (burg: Burg | {}): burg is Burg => !!Object.keys(burg);

const isFullState = (state: BaseState | FullState): state is FullState =>
  Object.keys(state).includes('campaigns');
