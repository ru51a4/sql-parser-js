class Query {
    columns = [];
    fromSources = [];
    joins = [];
    whereClauses = [];
    groupByColumns = [];
    sortColumns = [];
    limit = []
    static build = (input) => {
        input = input.split("\n").join(" ").trim()
            .split("(").join(" ( ")
            .split(")").join(" ) ")
            .split(",").join("")
            .split(" ")
            .filter(c => !!c).map((s) => s.toUpperCase())
        let lex = (str) => {
            let query = new Query();
            let isColumns = false;
            let isFromSources = false;
            let isJoin = false;
            let isWhere = false;
            let isGroup = false;
            let isOrder = false;
            let isLimit = false;
            let typeJoin = '';
            let typeJoins = ["INNER", "LEFT", "RIGHT", "FULL"];
            while (str.length) {
                let token = str.shift();
                if (token === 'SELECT') {
                    isColumns = true;
                    continue
                }
                if (token === 'FROM') {
                    isColumns = false;
                    isFromSources = true;
                    continue
                }
                if (typeJoins.includes(token)) {
                    if (str[0] === 'OUTER') {
                        str.shift();
                        typeJoin = "FULL OUTER";
                    }
                    str.shift();
                    typeJoin = token
                    isFromSources = false;
                    isJoin = true;
                    continue
                }
                if (token === 'JOIN') {
                    isFromSources = false;
                    isJoin = true;
                    continue
                }
                if (token === 'WHERE') {
                    isFromSources = false;
                    isJoin = false;
                    isWhere = true;
                    continue
                }
                if (token === 'GROUP') {
                    isFromSources = false;
                    isJoin = false;
                    isWhere = false;
                    isGroup = true;
                    str.shift();
                    continue
                }
                if (token === 'ORDER') {
                    isFromSources = false;
                    isJoin = false;
                    isWhere = false;
                    isGroup = false;
                    isOrder = true;
                    str.shift();
                    continue
                }
                if (token === 'LIMIT') {
                    isFromSources = false;
                    isJoin = false;
                    isWhere = false;
                    isGroup = false;
                    isOrder = false;
                    isLimit = true;
                    continue
                }
                if (isColumns) {
                    query.columns.push(token)
                    continue;
                }
                if (isFromSources) {
                    query.fromSources.push(token)
                    continue;
                }
                if (isJoin) {
                    query.joins.push({ type: typeJoin, token })
                    continue;
                }

                if (isWhere) {
                    query.whereClauses.push(token)
                    continue;
                }
                if (isGroup) {
                    query.groupByColumns.push(token)
                }
                if (isOrder) {
                    query.sortColumns.push(token)
                }
                if (isLimit) {
                    query.limit.push(token)
                }

            }
            let t = [];
            if (!query.fromSources.length) {
                throw 'Error in from';
            }
            for (let i = 0; i <= query.fromSources.length - 1; i = i + 2) {
                t.push({ "table": query.fromSources[i], 'alias': query.fromSources[i + 1] })
            }
            query.fromSources = t;

            t = [];



            for (let i = 0; i <= query.columns.length - 1; i++) {
                if (query.columns[i] === '(') {
                    query.columns[i + 1] = `(` + query.columns[i + 1]
                    continue
                } if (query.columns[i] === ')') {
                    t[t.length - 1].col += ')';
                    continue
                }
            }
            for (let i = 0; i <= query.columns.length - 1; i++) {
                if (query.columns[i + 1] === 'AS') {
                    if (!query.columns[i] || !query.columns[i + 2]) {
                        throw 'Error in columns';
                    }
                    t.push({ "col": query.columns[i], 'alias': query.columns[i + 2] })
                    i++
                    i++;
                } else {
                    t.push({ "col": query.columns[i] })
                }
            }
            query.columns = t;
            t = [];
            for (let i = 0; i <= query.joins.length - 1; i = i + 1) {

                if (query.joins[i]?.token === 'ON' || query.joins[i]?.token === 'AND' || query.joins[i]?.token === 'OR') {

                    t[t.length - 1].exp.push({ 'ttype': query.joins[i].token, 'left': query.joins[i + 1]?.token, 'right': query.joins[i + 3]?.token, 'type': query.joins[i + 2]?.token })
                    i++;
                    i++;
                    i++;
                } else {
                    t.push({ 'exp': [], 'type': query.joins[i]?.type, "table": query.joins[i]?.token, 'alias': query.joins[i + 1]?.token })
                    i++;
                }
            }
            query.joins = t;

            t = [];
            for (let i = 0; i <= query.whereClauses.length - 1; i = i + 3) {
                let next = (query.whereClauses[i + 3]);
                if (next) {
                    let r = [];
                    let left = query.whereClauses[i];
                    let type = query.whereClauses[i + 1];

                    if (type === 'IN') {
                        //todo
                        let q = query.whereClauses[i + 2];
                        i++;
                        i++;
                        i++;
                        i++
                        while (q != ')') {
                            q = query.whereClauses[i];
                            i++
                            r.push(q)
                        }
                        t.push({ "next": next, "left": query.whereClauses[i], 'right': query.whereClauses[i + 2], 'type': query.whereClauses[i + 1] })

                    } else {
                        t.push({ "next": next, "left": query.whereClauses[i], 'right': query.whereClauses[i + 2], 'type': query.whereClauses[i + 1] })

                    }
                    t.push({ "next": next, "left": query.whereClauses[i], 'right': query.whereClauses[i + 2], 'type': query.whereClauses[i + 1] })
                    i++
                }
                else {
                    t.push({ "left": query.whereClauses[i], 'right': query.whereClauses[i + 2], 'type': query.whereClauses[i + 1] })
                }
            }
            query.whereClauses = t;
            t = [];
            for (let i = 0; i <= query.groupByColumns.length - 1; i++) {
                t.push({ "col": query.groupByColumns[i] })
            }
            query.groupByColumns = t;
            t = [];
            for (let i = 0; i <= query.sortColumns.length - 1; i = i + 2) {
                if (!query.sortColumns[i]) {
                    throw 'Error in ORDER';
                }
                t.push({ "col": query.sortColumns[i], 'type': query.sortColumns[i + 1] })
                i++
            }
            query.sortColumns = t;
            t = [];
            for (let i = 0; i <= query.limit.length - 1; i++) {
                t.push({ 'type': 'limit', "col": query.limit[i] })
                if (query.limit[i + 1] === 'OFFSET') {
                    t.push({ 'type': 'OFFSET', "col": query.limit[i + 2] })
                }
                break
            }
            query.limit = t;
            return query;
        };


        let t = [[]];
        let nested = (str) => {
            let tt = [];
            let counter = 0;
            let stack = [];
            while (str.length) {
                let token = str.shift();
                if (token === '(') {
                    counter++;
                    if (str[0] === "SELECT") {
                        stack.push(counter)
                        t[t.length - 1].push(...tt);
                        tt = [];
                        t.push([])
                    } else {
                        tt[tt.length - 1] += (token + str.shift())
                    }
                }
                else if (token === ')') {
                    if (stack[stack.length - 1] === counter) {
                        stack.pop();
                        t[t.length - 1].push(...tt);
                        tt = [];
                        //
                        let c = t[t.length - 1];
                        t.pop();
                        t[t.length - 1].push(c);
                    } else {
                        tt[tt.length - 1] += (token)
                    }
                    counter--;

                } else {
                    tt.push(token)
                }
            }

        }
        console.log(JSON.parse(JSON.stringify(input)))
        nested(input);

        let calc = (c) => {
            c.splice(0, c.length - 1, lex(c))
        }
        let deep = (arr, init = true) => {
            for (let i = 0; i <= arr.length - 1; i++) {
                if (Array.isArray(arr[i])) {
                    if (arr[i].length === 1) {
                        arr[i] = arr[i][0];
                    } else {
                        deep(arr[i], 0);
                        i = i - 1;
                    }
                }
            }
            if (!init) {
                calc(arr)
            }
        }
        deep(t[0]);
        t = t[0]
        return t
    }
}
function getObject(input) {
    let q = new Query();
    return (Query.build(input))
}
