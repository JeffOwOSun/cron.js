/**
 * cron.js
 * ---
 * VERSION 0.1
 * ---
 * DON'T USE THIS -- IT'S NOT QUITE THERE YET!
 * ---
 * @author James Padolsey
 * @author Yushi Sun
 * ---
 * Dual licensed under the MIT and GPL licenses.
 *    - http://www.opensource.org/licenses/mit-license.php
 *    - http://www.gnu.org/copyleft/gpl.html
 */

/**
 * TODO:
 * 1. allow multiple cron time rules in one cron object
 * 2. allow white and black list rules
 * 3. provide the nextTick(now) function
 * 4. provide the enumerate(period) function
 */

/**
 * @class TimeGroup a group of crontime rules
 * @param rules {Array} an array of timeslot rules
 * [
 *   { 'rule': '* * * * * *', 'type': '+' },
 *   { 'rule': '* * * * * *', 'type': '+' },
 *   { 'rule': '* * * * * *', 'type': '-' },
 *   { 'rule': '* * * * * *', 'type': '-' },
 * ]
 */
function TimeGroup(rules) {
    this.rules = rules;
    this.cronTimes = rules.map(function(rule) {
        return {
            cronTime: new CronTime(rule.rule),
            type: rule.type,
        }
    });
}

TimeGroup.prototype = {
    nextTick: function nextTick(now) {
    },
    enumerate: function enumerate(startTime, stopTime) {
    },
};

function CronTime(time) {

    if (!(this instanceof CronTime)) {
        return new CronTime(time);
    }
        
    this.source = time;
    
    this.map = ['second', 'minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'];
    this.constraints = [[0,59],[0,59],[0,23],[1,31],[0,11],[1,7]];
    this.aliases = {
        jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12,
        sun:0,mon:1,tue:2,wed:3,thu:4,fri:5,sat:6
    };
    
    this.second = {};
    this.minute = {};
    this.hour = {};
    this.dayOfMonth = {};
    this.month = {};
    this.dayOfWeek = {};
    
    this._parse();
    
};

CronTime.prototype = {
    // parse the cron string into masks
    _parse: function() {
        
        var aliases = this.aliases,
            //replace aliases with numbers
            source = this.source.replace(/[a-z]/i, function(alias){
                
                alias = alias.toLowerCase();
                
                if (alias in aliases) {
                    return aliases[alias];
                }
                
                throw new Error('Unknown alias: ' + alias);
                
            }),
            //remove exuberant spaces
            split = this.source.replace(/^\s\s*|\s\s*$/g, '').split(/\s+/),
            //len is the number of fields in the rule to process
            cur, len = 6;
        
        while (len--) {
            cur = split[len] || '*';
            this._parseField(cur, this.map[len], this.constraints[len]);
        }
        
    },
    _parseField: function(field, type, constraints) {
        
        var rangePattern = /(\d+?)(?:-(\d+?))?(?:\/(\d+?))?(?:,|$)/g,
            typeObj = this[type],
            diff,
            low = constraints[0],
            high = constraints[1];
        
        // * is a shortcut to [lower-upper] range
        field = field.replace(/\*/g,  low + '-' + high);
            
        if (field.match(rangePattern)) {
            
            field.replace(rangePattern, function($0, lower, upper, step) {
                
                step = step || 1;
                
                // Positive integer higher than constraints[0]
                lower = Math.max(low, ~~Math.abs(lower));
                
                // Positive integer lower than constraints[1]
                upper = upper ? Math.min(high, ~~Math.abs(upper)) : lower;
                
                diff = step + upper - lower;
                
                while ((diff-=step) > -1) {
                    typeObj[diff + lower] = true;
                }
                
            });
            
        } else {
            
            throw new Error('Field (' + field + ') cannot be parsed');
            
        }
        
    },
    //given a date object, tell if it fits this cronTimeRule
    valid: function(date) {
        var now = {},
            i;
        now.second = date.getSeconds();
        now.minute = date.getMinutes();
        now.hour = date.getHours();
        now.dayOfMonth = date.getDate();
        now.month = date.getMonth();
        now.dayOfWeek = date.getDay();

        for (i in now) {
            if (!(now[i] in this[i])) {
                return false;
            }
        }
        return true;
    }
};

function CronJob(cronTime, event) {
    
    //work as factory
    if (!(this instanceof CronJob)) {
        return new CronJob(cronTime, event);
    }
    
    this.events = [event];
    this.cronTime = new CronTime(cronTime);
    this.now = {};
    this.initiated = false;
    
    this.clock();
    
}

CronJob.prototype = {
    
    addEvent: function(event) {
        this.events.push(event);
    },
    
    runEvents: function() {
        for (var i = -1, l = this.events.length; ++i < l; ) {
            if (typeof this.events[i] === 'function') {
                this.events[i]();
            }
        }
    },
    
    clock: function() {
        
        var date = new Date,
            now = this.now,
            self = this,
            cronTime = this.cronTime,
            i;
        
        if (!this.initiated) {
            // Make sure we start the clock precisely ON the 0th millisecond
            setTimeout(function(){
                self.initiated = true;
                self.clock();
            }, Math.ceil(+date / 1000) * 1000 - +date);
            return;
        }
        
        this.timer = this.timer || setInterval(function(){self.clock();}, 1000);
        
        now.second = date.getSeconds();
        now.minute = date.getMinutes();
        now.hour = date.getHours();
        now.dayOfMonth = date.getDate();
        now.month = date.getMonth();
        now.dayOfWeek = date.getDay();
        
        for (i in now) {
            if (!(now[i] in cronTime[i])) {
                return;
            }
        }
        
        this.runEvents();
        
    }
    
};

module.exports = {
    CronTime: CronTime,
    CronJob: CronJob,
}
