import { Platform } from 'react-native';
import { firebaseConfig } from './firebaseconfig.base';

const platformModule = Platform.OS === 'web'
	? require('./firebaseconfig.web')
	: require('./firebaseconfig.native');

export { firebaseConfig };
export const { app, auth } = platformModule;