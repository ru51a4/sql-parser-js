import SimpleSqlParserJs from "./index.js"

class mysql {
    static table = {
        "POSTS": {
            col: ['ID', 'MSG', 'USER_ID', 'DIARY_ID'],
            data: [
                [1, "hello world", 1, 1],
                [2, "hello world1", 1, 1],
                [3, "hello world2", 1, 1],
                [4, "hello world3", 1, 1],
                [50, "hello world4", 1, 1],
                [51, "kek", 2, 1],

            ],
        },
        "USERS": {
            col: ["ID", "LOGIN", "STATUS"],
            data: [
                [1, "admin", 1],
                [2, "user", 2],
            ]
        },
        "DIARY": {
            col: ["ID", "NAME", "USER_ID"],
            data: [
                [1, "php и рефлексия", 1],
            ]
        }
    };
    static query(str) {
        let operation = [];
        operation["<"] = (a, b) => {
            return a < b;
        }
        operation[">"] = (a, b) => {
            return a > b;
        }
        operation["="] = (a, b) => {
            return a == b;
        }
        operation["<>"] = (a, b) => {
            return a != b;
        }
        let _query = SimpleSqlParserJs.build(str)[0];
        let res = [];
        let aliasTable = [];
        aliasTable[_query.fromSources[0].alias] = _query.fromSources[0].table;

        for (let i = 0; i <= mysql.table[_query.fromSources[0].table].data.length - 1; i++) {
            let rrow = [];
            let f = true;
            let row = mysql.getObj(_query.fromSources[0].table, i, _query.fromSources[0].alias);
            //join
            for (let j = 0; j <= _query.joins.length - 1; j++) {
                let jf = true;
                let jt = _query.joins[j].table
                let ja = _query.joins[j].alias;

                aliasTable[ja] = jt;
                let jjj = [];
                for (let jj = 0; jj <= mysql.table[jt].data.length - 1; jj++) {
                    //
                    let left = _query.joins[j].exp[0].left.split(".");
                    let right = _query.joins[j].exp[0].right.split(".");
                    let j_table_left = mysql.table[aliasTable[left[0]]];
                    let j_table_right = mysql.table[aliasTable[right[0]]];
                    let iLeft = j_table_left.col.indexOf(left[1])
                    let iRight = j_table_right.col.indexOf(right[1])
                    if (operation['='](j_table_left.data[i][iLeft], j_table_right.data[jj][iRight])) {
                        let currJoinRow = mysql.getObj(jt, jj, ja);
                        let _row = rrow[i] ? rrow[i] : JSON.parse(JSON.stringify(row));
                        mysql.mergeObj(_row, currJoinRow)
                        rrow[i] = (_row);
                    }
                }
            }
            if (!rrow.length) {
                rrow.push(row);
            }
            rrow = rrow.filter((el) => {
                for (let j = 0; j <= _query.whereClauses.length - 1; j++) {
                    let left = _query.whereClauses[j].left;
                    left = el[left];
                    let right = _query.whereClauses[j].right;
                    if (!operation[_query.whereClauses[j].type](left, right)) {
                        return 0;
                    }
                }
                return 1;
            });
            //
            res.push(...rrow);
        }
        return (res)
    }

    static mergeObj(obj, obj2) {

        Object.keys(obj2).forEach((key) => {
            obj[key] = obj2[key];
        })
    }

    static getObj(table, j, alias) {
        let obj = {};
        let r = mysql.table[table];
        for (let i = 0; i <= r.col.length - 1; i++) {
            obj[alias ? alias + '.' + r.col[i] : "" + r.col[i]] = r.data[j][i];
        }
        return obj;
    }
}
console.log(mysql.query(`
SELECT * FROM posts p  
JOIN users u ON p.user_id = u.id
JOIN diary d ON p.diary_id = d.id
WHERE u.id = 2
`)) 