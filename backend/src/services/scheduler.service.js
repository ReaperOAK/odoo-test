const cron = require('node-cron');
const LateFeeService = require('./lateFee.service');
const logger = require('../utils/logger');

class SchedulerService {
  
  static init() {
    // Run late fee processing every day at 6 AM
    cron.schedule('0 6 * * *', async () => {
      logger.info('Starting scheduled late fee processing...');
      try {
        const results = await LateFeeService.processOverdueItems();
        logger.info('Scheduled late fee processing completed:', results);
      } catch (error) {
        logger.error('Error in scheduled late fee processing:', error);
      }
    });
    
    // Run late fee processing every 6 hours for more frequent updates
    cron.schedule('0 */6 * * *', async () => {
      logger.info('Starting frequent late fee update check...');
      try {
        const results = await LateFeeService.processOverdueItems();
        if (results.updated > 0 || results.created > 0) {
          logger.info('Frequent late fee update completed:', results);
        }
      } catch (error) {
        logger.error('Error in frequent late fee update:', error);
      }
    });
    
    logger.info('Late fee scheduler initialized');
  }
  
  static async runNow() {
    logger.info('Running late fee processing manually...');
    try {
      const results = await LateFeeService.processOverdueItems();
      logger.info('Manual late fee processing completed:', results);
      return results;
    } catch (error) {
      logger.error('Error in manual late fee processing:', error);
      throw error;
    }
  }
}

module.exports = SchedulerService;
