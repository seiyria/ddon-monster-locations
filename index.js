
Vue.component('multiselect', VueMultiselect.default);

var vue = new Vue({
    el: '#app',
    data: {
        search: '',
        translations: { enemy: {} },
        currentMonsters: [],
        allMonsters: [],
        neededZones: [],
        noExtraData: true,
        loading: true
    },
    methods: {
        updateHash() {
            updateWindowHash();
        },
        copy() {
            var dt = new clipboard.DT();
            dt.setData('text/plain', window.location.href);
            clipboard.write(dt);
        }
    }
});

function formatData(data) {
    return _(data.regions)
        .map(({ name, subregions }) => {
            var regionName = name;

            return _.map(subregions, ({ name, location, level, abbrev, monsters, ir, areaLevel }) => {

                var regionInfo = { name, location, level, abbrev, ir, areaLevel };

                var sumName = name === regionName ? name : regionName + ' - ' + name;

                if(monsters.length === 0) {
                    vue.neededZones.push(regionName + ' - ' + name);
                }

                return {
                    regionName: sumName  + ' ~ ' + 'Lv. ' + level,
                    monsterInfo: _.sortBy(_.map(monsters, ({ name, level, timePeriod, events, coordinates }) => {
                        return {
                            name: name + ' ~ Lv. ' + level + ' (' + abbrev + ')',
                            data: {
                                name, level, timePeriod,
                                events: events || [], coordinates: coordinates || []
                            },
                            regionData: regionInfo
                        };
                    }), 'data.level')
                };

            });
        })
        .flattenDeep()
        .value();
}

function loadPreviousMonsters() {
    var loadMonster = window.location.hash;
    if(!loadMonster) return;

    var searchNames = decodeURIComponent(loadMonster.substring(1)).split('|');

    if(!searchNames || !searchNames.length) return;

    searchNames.forEach(searchName => {
        var realSearchName = searchName
            .split('~')
            .join(' ~ ')
            .split('Lv')
            .join('Lv. ')
            .split('(')
            .join(' (');

        var monsterObj = _(vue.allMonsters)
            .map('monsterInfo')
            .flattenDeep()
            .filter(mon => _.includes(mon.name, realSearchName))
            .value();

        if(!monsterObj || !monsterObj.length) return;

        vue.currentMonsters.push(...monsterObj);
    });

}

function updateWindowHash() {
    var allMonsters = vue.currentMonsters
        .map(x => x.name
            .split(' ~ ')
            .join('~')
            .split('Lv. ')
            .join('Lv')
            .split(' (')
            .join('(')
        )
        .join('|');

    window.location.hash = '#' + encodeURIComponent(allMonsters);
}

function translationXMLToHash(xmlData) {
    var translations = {};

    _.each(xmlData.resource[0].message, ({ original, translation }) => {
        translations[translation[0]._text] = original[0]._text;
    });

    return translations;
}

function loadKey(key) {
    return JSON.parse(localStorage.getItem(key));
}

function saveKey(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

axios.get('monsters.yml')
    .then(res => {
        var allData = YAML.parse(res.data);

        vue.allMonsters = formatData(allData);

        var translations = allData.translations;

        loadPreviousMonsters();
        vue.loading = false;

        return {
            _commit: translations.commit,
            enemy: 'https://cdn.rawgit.com/' + translations.repo + '/' + translations.commit + '/ui/00_message/enemy/enemy_name.xml'
        };
    }).then(({ _commit, enemy }) => {
        var oldEnemyTranslationData = loadKey(_commit + '-enemyTranslation');
        var enemyPromise = oldEnemyTranslationData ? Promise.resolve(oldEnemyTranslationData) : axios.get(enemy);
        return Promise.all([Promise.resolve(_commit), enemyPromise]);

    }).then(([ _commit, enemy ]) => {
        if(enemy.data) {
            vue.translations.enemy = translationXMLToHash(xmlToJSON.parseString(enemy.data));
        } else {
            vue.translations.enemy = enemy;
        }
    
        saveKey(_commit + '-enemyTranslation', vue.translations.enemy);

    });
