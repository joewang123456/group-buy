function timeDown (milliSecond) {

    function formate (val) {
        if(val > 9) return val;
        return `0${val}`;
    }
    
    let s,m,h;
    h = parseInt(milliSecond / 1000 / 60 / 60 );
    m = parseInt(milliSecond / 1000 / 60 );
    s = parseInt(milliSecond / 1000 % 60 );

    return {
        hour: formate(h),
        minute: formate(m),
        second: formate(s)
    }
}