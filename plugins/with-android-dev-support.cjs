const { withMainApplication } = require('expo/config-plugins');

module.exports = function withAndroidDevSupport(config) {
  return withMainApplication(config, (result) => {
    if (result.modResults.language === 'kt' && !result.modResults.contents.includes('useDevSupport = BuildConfig.DEBUG')) {
      result.modResults.contents = result.modResults.contents.replace(
        'context = applicationContext,',
        'context = applicationContext,\n      useDevSupport = BuildConfig.DEBUG,'
      );
    }
    return result;
  });
};
