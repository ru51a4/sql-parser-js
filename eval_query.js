import SimpleSqlParserJs from "./index.js"

class mysql {
    static table = {
        "POSTS": {
            col: ['ID', 'MSG', 'USER_ID', 'DIARY_ID'],
            data: [
                [1, "Мой блог о php", 1, 1],
                [2, "Как дела?", 2, 1],
                [3, "Мой уютный блог обо всем на свете", 2, 2],
                [4, "Сегодня хорошая погода", 2, 2],
            ],
        },
        "USERS": {
            col: ["ID", "LOGIN", "STATUS"],
            data: [
                [1, "admin", 1],
                [2, "user", 3],
            ]
        },
        "DIARY": {
            col: ["ID", "NAME", "USER_ID"],
            data: [
                [1, "php и рефлексия", 2],
                [2, "уютный бложик", 1],
            ]
        }
    };

    static query(str) {
        return mysql._query(SimpleSqlParserJs.build(str)[0]);
    }
    static _query(tt) {
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
        let _query = tt;
        let res = [];
        let aliasTable = [];
        aliasTable[_query.fromSources[0].alias] = _query.fromSources[0].table;
        let rrow = [];

        let join = (row, jj) => {
            for (let j = jj; j <= jj; j++) {
                let jf = true;
                let jt = _query.joins[j].table
                let ja = _query.joins[j].alias;

                if (typeof _query.joins[j].table === "object") {
                    mysql.table[ja] = {};
                    let subquery = mysql._query(_query.joins[j].table);
                    mysql.table[ja].col = Object.keys(subquery[0]).map(c => c.split(".")[1]);
                    mysql.table[ja].data = subquery.map((c) => Object.values(c));
                    aliasTable[ja] = ja;
                    jt = ja;
                } else {
                    aliasTable[ja] = jt;
                }
                let jjj = [];
                for (let jj = 0; jj <= mysql.table[jt].data.length - 1; jj++) {
                    //
                    let left = _query.joins[j].exp[0].left.split(".");
                    let right = _query.joins[j].exp[0].right.split(".");
                    let j_table_right = mysql.table[aliasTable[right[0]]];
                    let iRight = j_table_right.col.indexOf(right[1])
                    if (operation['='](row[left[0] + '.' + left[1]], j_table_right.data[jj][iRight])) {
                        let currJoinRow = mysql.getObj(jt, jj, ja);
                        let __row = JSON.parse(JSON.stringify(row));
                        mysql.mergeObj(__row, currJoinRow)
                        if (_query.joins.length - 1 == j) {
                            rrow.push(__row);
                        } else if (_query.joins.length - 1 <= j + 1) {
                            join(__row, j + 1)
                        }
                    }
                }
            }
        }

        for (let i = 0; i <= mysql.table[_query.fromSources[0].table].data.length - 1; i++) {
            let row = mysql.getObj(_query.fromSources[0].table, i, _query.fromSources[0].alias);
            //join
            rrow = [];
            if (_query.joins.length) {
                join(row, 0, i)
            }
            else {
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
        //group by
        if (_query.groupByColumns.length) {
            let grrow = [];
            //
            let selects = [];
            let maxCol = null;
            let countCol = null;
            _query.columns.forEach((c) => {
                if (c.col.fn === "MAX") {
                    maxCol = c.col.args[0]
                }
                if (c.col.fn === "COUNT(*)") {
                    countCol = true;
                }
            });
            //
            for (let i = 0; i <= _query.groupByColumns.length - 1; i++) {
                for (let j = 0; j <= res.length - 1; j++) {
                    if (!grrow[res[j][_query.groupByColumns[i].col]]) {
                        grrow[res[j][_query.groupByColumns[i].col]] = [];
                    }
                    grrow[res[j][_query.groupByColumns[i].col]].push(res[j]);
                }
            }
            res = [...grrow.filter((c) => c)];
            for (let i = 0; i <= res.length - 1; i++) {
                let length = res[i].length;
                if (maxCol) {
                    res[i] = res[i].sort((b, a) => a[maxCol] - b[maxCol])[0]
                    res[i]['_.COUNT'] = length;
                } else {
                    res[i] = res[i][res[i].length - 1]
                    res[i]['_.COUNT'] = length;
                }
            }
        }

        //ORDER BY
        if (_query.sortColumns.length) {
            if (_query.sortColumns[0].type == "DESC") {
                res = res.sort((b, a) => a[_query.sortColumns[0].col] - b[_query.sortColumns[0].col])
            } else {
                res = res.sort((a, b) => a[_query.sortColumns[0].col] - b[_query.sortColumns[0].col])
            }
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


//index
let sortedBlogs = mysql.query(`
        SELECT * FROM diary d 
        JOIN (SELECT p.diary_id, max(p.id) FROM posts p GROUP BY p.diary_id) pp on d.id = pp.diary_id
        JOIN users u on d.user_id = u.id
        ORDER BY pp.id DESC
    `);
console.log("=================")
sortedBlogs.forEach((blog) => {
    console.log(`# ${blog['D.ID']} ${blog['D.NAME']} [by ${blog["U.LOGIN"]}]`)
});
console.log("=================")
//posts diary_id = 1
let blog1 = mysql.query(`
        SELECT * FROM posts p
        JOIN diary d on p.diary_id = d.id 
        JOIN users u on p.user_id = u.id
        WHERE d.id = 1
        ORDER BY p.id ASC
    `);
console.log("")
console.log(`======START:${blog1[0]["D.NAME"]}======`)
blog1.forEach((el) => {
    console.log(`#${el['P.ID']} ${el['P.MSG']} [by ${el['U.LOGIN']}]`)
});
console.log(`======END:${blog1[0]["D.NAME"]}======`)