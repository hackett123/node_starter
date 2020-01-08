function hypername(name) {
    var link = "\"\\profile\\" + name + "\"";
    return "<a href="+link+ ">"+name+"</a>";
}

module.exports = {
    hypername: hypername
}